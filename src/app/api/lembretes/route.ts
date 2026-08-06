import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { data: config } = await supabase
    .from("configuracao")
    .select("valor")
    .eq("chave", "hora_lembrete")
    .maybeSingle();

  const horaEscolhida = Number(config?.valor ?? 7);
  if (horaLocal !== horaEscolhida) {
    return Response.json({ enviados: 0, motivo: "fora do horário", horaLocal });
  }

  // segunda = 1 ... domingo = 7, como a agenda guarda
  const diaDaSemana = ((new Date(`${hojeLocal}T12:00:00`).getDay() + 6) % 7) + 1;

  const { data: agenda } = await supabase
    .from("aluno_agenda")
    .select("aluno_id, treino:treino_id(id, letra, titulo)")
    .eq("dia_semana", diaDaSemana)
    .not("treino_id", "is", null);

  if (!agenda?.length) {
    return Response.json({ enviados: 0, motivo: "ninguém treina hoje" });
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
      supabase
        .from("sessao")
        .select("aluno_id")
        .eq("data", hojeLocal)
        .not("finalizada_em", "is", null),
      supabase
        .from("aluno")
        .select("id, token_link, acesso_bloqueado_em, arquivado_em")
        .in(
          "id",
          agenda.map((linha) => linha.aluno_id),
        ),
    ]);

  const jaTreinou = new Set((sessoes ?? []).map((s) => s.aluno_id));
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

    const treino = treinoDe.get(assinatura.aluno_id);

    try {
      await webpush.sendNotification(
        {
          endpoint: assinatura.endpoint,
          keys: { p256dh: assinatura.p256dh, auth: assinatura.auth },
        },
        JSON.stringify({
          titulo: "Hora de treinar",
          corpo: treino
            ? `Hoje é treino ${treino.letra} — ${treino.titulo}.`
            : "Hoje tem treino.",
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

  return Response.json({ enviados, desativadas: mortas.length });
}
