import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { DIAS_DE_ANTECEDENCIA, vencimentoNoMes } from "@/lib/mensalidades";

/**
 * Dispara os lembretes do dia.
 *
 * Roda de hora em hora e so faz alguma coisa quando bate o horario escolhido
 * pela Kelly — assim ela muda o horario no painel sem ninguem mexer em
 * configuracao de servidor.
 *
 * Recebe lembrete apenas quem tem treino marcado para hoje na agenda e ainda
 * nao finalizou. Quem ja treinou nao e incomodado.
 */
export async function GET(request: Request) {
  const autorizacao = request.headers.get("authorization");
  if (autorizacao !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ erro: "não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const agora = new Date();
  const horaLocal = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(agora),
  );
  const hojeLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(agora);

  // roda sempre, independente do horario do lembrete: e idempotente, e deixar
  // para um horario so significaria a cobranca nascer atrasada se aquela
  // execucao falhasse
  const lancadas = await lancarMensalidadesDoMes(supabase, hojeLocal);

  const { data: config } = await supabase
    .from("configuracao")
    .select("valor")
    .eq("chave", "hora_lembrete")
    .maybeSingle();

  const horaEscolhida = Number(config?.valor ?? 7);
  if (horaLocal !== horaEscolhida) {
    return Response.json({
      enviados: 0,
      lancadas,
      motivo: "fora do horário do lembrete",
      horaLocal,
    });
  }

  // segunda = 1 ... domingo = 7, como a agenda guarda
  const diaDaSemana = ((new Date(`${hojeLocal}T12:00:00`).getDay() + 6) % 7) + 1;

  const { data: agenda } = await supabase
    .from("aluno_agenda")
    .select("aluno_id, treino:treino_id(id, letra, titulo)")
    .eq("dia_semana", diaDaSemana)
    .not("treino_id", "is", null);

  if (!agenda?.length) {
    return Response.json({ enviados: 0, lancadas, motivo: "ninguém treina hoje" });
  }

  const [{ data: assinaturas }, { data: sessoes }, { data: alunos }] =
    await Promise.all([
      supabase
        .from("aluno_lembrete")
        .select("*")
        .is("desativado_em", null)
        .in(
          "aluno_id",
          agenda.map((linha) => linha.aluno_id),
        ),
      // 60 dias para conseguir dizer ha quanto tempo o aluno sumiu, nao so se
      // ele treinou hoje
      supabase
        .from("sessao")
        .select("aluno_id, data")
        .not("finalizada_em", "is", null)
        .gte("data", diasAntes(hojeLocal, 60))
        .order("data", { ascending: false }),
      supabase
        .from("aluno")
        .select("id, token_link, acesso_bloqueado_em, arquivado_em")
        .in(
          "id",
          agenda.map((linha) => linha.aluno_id),
        ),
    ]);

  const jaTreinou = new Set(
    (sessoes ?? []).filter((s) => s.data === hojeLocal).map((s) => s.aluno_id),
  );

  // a consulta ja vem da mais recente para a mais antiga
  const ultimoTreino = new Map<string, string>();
  for (const sessao of sessoes ?? []) {
    if (!ultimoTreino.has(sessao.aluno_id)) {
      ultimoTreino.set(sessao.aluno_id, sessao.data);
    }
  }
  const podeReceber = new Map(
    (alunos ?? [])
      .filter((a) => !a.arquivado_em && !a.acesso_bloqueado_em)
      .map((a) => [a.id, a.token_link as string]),
  );
  const treinoDe = new Map(
    agenda.map((linha) => [
      linha.aluno_id,
      linha.treino as unknown as { letra: string; titulo: string } | null,
    ]),
  );

  webpush.setVapidDetails(
    "mailto:kellyjhuly1991@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  let enviados = 0;
  const mortas: string[] = [];

  for (const assinatura of assinaturas ?? []) {
    const token = podeReceber.get(assinatura.aluno_id);
    if (!token || jaTreinou.has(assinatura.aluno_id)) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: assinatura.endpoint,
          keys: { p256dh: assinatura.p256dh, auth: assinatura.auth },
        },
        JSON.stringify({
          ...mensagemPara(
            treinoDe.get(assinatura.aluno_id),
            ultimoTreino.get(assinatura.aluno_id),
            hojeLocal,
          ),
          url: `/aluno/${token}`,
        }),
      );
      enviados++;
    } catch (erro) {
      // 404/410 = o aparelho desinstalou ou revogou: nao adianta insistir
      const status = (erro as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) mortas.push(assinatura.endpoint);
    }
  }

  if (mortas.length > 0) {
    await supabase
      .from("aluno_lembrete")
      .update({ desativado_em: new Date().toISOString() })
      .in("endpoint", mortas);
  }

  return Response.json({ enviados, lancadas, desativadas: mortas.length });
}

/**
 * Cria a mensalidade do mes de quem tem valor e vencimento combinados.
 *
 * Nasce cinco dias antes de vencer — cedo o bastante para o aluno se organizar,
 * tarde o bastante para nao ficar um mes inteiro cobrando quem esta em dia.
 *
 * A janela vai ate o proprio vencimento. Aluno cadastrado depois do dia de
 * vencimento dele so comeca a pagar no mes seguinte, em vez de receber uma
 * cobranca ja nascendo atrasada.
 */
async function lancarMensalidadesDoMes(
  supabase: ReturnType<typeof createAdminClient>,
  hoje: string,
) {
  const { data: alunos } = await supabase
    .from("aluno")
    .select("id, valor_mensalidade, dia_vencimento")
    .is("arquivado_em", null)
    .not("valor_mensalidade", "is", null)
    .not("dia_vencimento", "is", null);

  if (!alunos?.length) return 0;

  const competencia = `${hoje.slice(0, 7)}-01`;
  const novas = [];

  for (const aluno of alunos) {
    const vencimento = vencimentoNoMes(aluno.dia_vencimento, hoje);
    const faltam = diferencaEmDias(hoje, vencimento);

    if (faltam > DIAS_DE_ANTECEDENCIA || faltam < 0) continue;

    novas.push({
      aluno_id: aluno.id,
      competencia,
      valor: aluno.valor_mensalidade,
      vencimento,
    });
  }

  if (novas.length === 0) return 0;

  // ignoreDuplicates: rodando de hora em hora, a segunda vez do dia nao pode
  // sobrescrever uma mensalidade que a Kelly ja tenha ajustado ou dado baixa
  const { data } = await supabase
    .from("mensalidade")
    .upsert(novas, { onConflict: "aluno_id,competencia", ignoreDuplicates: true })
    .select("id");

  return data?.length ?? 0;
}

/** Quantos dias faz que o aluno sumiu passa a valer mais do que a letra de hoje. */
const DIAS_PARA_MUDAR_O_TOM = 7;

/**
 * Para quem esta na rotina, a letra do dia — e o que faz a pessoa decidir se da
 * tempo hoje. Para quem sumiu, a letra nao interessa: o problema dele nao e
 * qual treino, e voltar.
 *
 * Em nenhum caso cobramos treino perdido. Aluno que ja se sente mal por ter
 * faltado, recebendo cobranca, desinstala em vez de treinar.
 */
function mensagemPara(
  treino: { letra: string; titulo: string } | null | undefined,
  ultimo: string | undefined,
  hoje: string,
) {
  const dias = ultimo ? diferencaEmDias(ultimo, hoje) : null;

  if (dias === null) {
    return {
      titulo: "Seu treino está esperando",
      corpo: "Bora começar? É só abrir e seguir a planilha.",
    };
  }

  if (dias > DIAS_PARA_MUDAR_O_TOM) {
    return {
      titulo: "Faz tempo que você não aparece",
      corpo: `Seu último treino foi há ${dias} dias. Bora voltar?`,
    };
  }

  return {
    titulo: "Hora de treinar",
    corpo: treino
      ? `Hoje é treino ${treino.letra} — ${treino.titulo}.`
      : "Hoje tem treino.",
  };
}

function diasAntes(data: string, dias: number) {
  const dia = new Date(`${data}T12:00:00Z`);
  dia.setDate(dia.getDate() - dias);
  return dia.toISOString().slice(0, 10);
}

function diferencaEmDias(de: string, ate: string) {
  const inicio = new Date(`${de}T12:00:00Z`).getTime();
  const fim = new Date(`${ate}T12:00:00Z`).getTime();
  return Math.round((fim - inicio) / 86_400_000);
}
