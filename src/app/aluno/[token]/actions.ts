"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarPainel } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * O aluno nao tem login: o token da URL e a credencial dele. Toda acao comeca
 * traduzindo token -> aluno e confere se o exercicio pedido pertence mesmo a
 * uma planilha desse aluno, para que um token nao consiga mexer no treino de
 * outra pessoa.
 */
async function alunoDoToken(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("aluno")
    .select("id")
    .eq("token_link", token)
    .is("arquivado_em", null)
    .is("acesso_bloqueado_em", null)
    .maybeSingle();

  return data ? { supabase, alunoId: data.id as string } : null;
}

type Contexto = NonNullable<Awaited<ReturnType<typeof alunoDoToken>>>;

async function sessaoDeHoje(
  { supabase, alunoId }: Contexto,
  treinoId: string,
) {
  const { data: treino } = await supabase
    .from("treino")
    .select("id")
    .eq("id", treinoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  if (!treino) return undefined;

  const hoje = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("sessao")
    .upsert(
      { aluno_id: alunoId, treino_id: treinoId, data: hoje },
      { onConflict: "aluno_id,treino_id,data" },
    )
    .select("id")
    .single();

  return data?.id as string | undefined;
}

async function itemPertenceAoAluno(
  { supabase, alunoId }: Contexto,
  itemId: string,
) {
  const { data } = await supabase
    .from("treino_exercicio")
    .select("id, treino:treino_id(aluno_id)")
    .eq("id", itemId)
    .maybeSingle();

  const treino = data?.treino as unknown as { aluno_id: string } | null;
  return treino?.aluno_id === alunoId;
}

export async function marcarExercicio(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const contexto = await alunoDoToken(token);
  if (!contexto) return;

  const treinoId = String(formData.get("treino_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  if (!(await itemPertenceAoAluno(contexto, itemId))) return;

  const sessaoId = await sessaoDeHoje(contexto, treinoId);
  if (!sessaoId) return;

  const cargaBruta = String(formData.get("carga_kg") ?? "").trim();
  const carga = cargaBruta ? Number(cargaBruta.replace(",", ".")) : null;

  await contexto.supabase.from("sessao_item").upsert(
    {
      sessao_id: sessaoId,
      treino_exercicio_id: itemId,
      feito: formData.get("feito") === "sim",
      carga_kg: carga !== null && Number.isFinite(carga) ? carga : null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "sessao_id,treino_exercicio_id" },
  );

  revalidatePath(`/aluno/${token}`);
}

/**
 * Guarda a assinatura de push daquele aparelho.
 *
 * O endpoint e unico por aparelho, entao reassinar no mesmo celular atualiza a
 * linha em vez de criar outra — e reativa se ela tinha sido desativada.
 */
export async function salvarAssinatura(dados: {
  token: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const contexto = await alunoDoToken(dados.token);
  if (!contexto) return;

  await contexto.supabase.from("aluno_lembrete").upsert(
    {
      aluno_id: contexto.alunoId,
      endpoint: dados.endpoint,
      p256dh: dados.p256dh,
      auth: dados.auth,
      desativado_em: null,
    },
    { onConflict: "endpoint" },
  );
}

export async function removerAssinatura(dados: {
  token: string;
  endpoint: string;
}) {
  const contexto = await alunoDoToken(dados.token);
  if (!contexto) return;

  await contexto.supabase
    .from("aluno_lembrete")
    .delete()
    .eq("aluno_id", contexto.alunoId)
    .eq("endpoint", dados.endpoint);
}

const TIPOS_ACEITOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const TAMANHO_MAXIMO = 6 * 1024 * 1024;

export type EstadoComprovante = { erro?: string; enviado?: boolean };

/**
 * O aluno avisa que pagou e anexa o comprovante do Pix.
 *
 * Isso nao marca a mensalidade como paga — quem confere e a Kelly. Mas tira o
 * aluno da regua de cobranca na hora: ele fez a parte dele, e travar o treino
 * de quem pagou por causa da fila de conferencia dela puniria a pessoa errada.
 */
export async function enviarComprovante(
  _anterior: EstadoComprovante,
  formData: FormData,
): Promise<EstadoComprovante> {
  const token = String(formData.get("token") ?? "");
  const contexto = await alunoDoToken(token);
  if (!contexto) return { erro: "Não consegui identificar seu cadastro." };

  const arquivo = formData.get("comprovante");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha o arquivo do comprovante." };
  }
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { erro: "Envie uma imagem (print) ou um PDF." };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { erro: "Arquivo muito grande. O limite é 6 MB." };
  }

  // pega a mensalidade em aberto mais antiga: e a que ele esta pagando
  const { data: mensalidade } = await contexto.supabase
    .from("mensalidade")
    .select("id")
    .eq("aluno_id", contexto.alunoId)
    .is("pago_em", null)
    .is("arquivado_em", null)
    .order("vencimento")
    .limit(1)
    .maybeSingle();

  if (!mensalidade) {
    return { erro: "Você não tem mensalidade em aberto no momento." };
  }

  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const caminho = `${contexto.alunoId}/${mensalidade.id}-${Date.now()}.${extensao}`;

  const { error: erroUpload } = await contexto.supabase.storage
    .from("comprovantes")
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: true });

  if (erroUpload) {
    console.error(`[kelly-treinos] upload do comprovante: ${erroUpload.message}`);
    return { erro: "Não consegui receber o arquivo. Tente de novo." };
  }

  await contexto.supabase
    .from("mensalidade")
    .update({
      comprovante_caminho: caminho,
      enviado_em: new Date().toISOString(),
      forma: "Pix",
    })
    .eq("id", mensalidade.id);

  // o aviso vai depois da resposta: o aluno nao pode esperar o celular da
  // Kelly para saber que o envio deu certo
  const { data: aluno } = await contexto.supabase
    .from("aluno")
    .select("nome")
    .eq("id", contexto.alunoId)
    .single();

  after(() =>
    avisarPainel(contexto.supabase, {
      titulo: "Comprovante recebido",
      corpo: `${aluno?.nome ?? "Um aluno"} enviou o comprovante do Pix.`,
      url: "/painel",
    }),
  );

  revalidatePath(`/aluno/${token}`);
  return { enviado: true };
}

const PERCEPCOES = ["facil", "na_medida", "puxado"] as const;

/** Como o treino de hoje foi para o aluno. E o que a Kelly nao tinha como saber. */
export async function enviarFeedback(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const contexto = await alunoDoToken(token);
  if (!contexto) return;

  const sessaoId = await sessaoDeHoje(
    contexto,
    String(formData.get("treino_id") ?? ""),
  );
  if (!sessaoId) return;

  const escolha = String(formData.get("percepcao") ?? "");
  const percepcao = PERCEPCOES.includes(escolha as (typeof PERCEPCOES)[number])
    ? escolha
    : null;

  const comentario = String(formData.get("comentario") ?? "").trim();

  await contexto.supabase
    .from("sessao")
    .update({
      ...(percepcao ? { percepcao } : {}),
      ...(formData.has("comentario") ? { comentario: comentario || null } : {}),
    })
    .eq("id", sessaoId);

  revalidatePath(`/aluno/${token}`);
}

export async function finalizarTreino(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const contexto = await alunoDoToken(token);
  if (!contexto) return;

  const treinoId = String(formData.get("treino_id") ?? "");
  const sessaoId = await sessaoDeHoje(contexto, treinoId);
  if (!sessaoId) return;

  const desfazer = formData.get("desfazer") === "sim";

  await contexto.supabase
    .from("sessao")
    .update({ finalizada_em: desfazer ? null : new Date().toISOString() })
    .eq("id", sessaoId);

  revalidatePath(`/aluno/${token}`);
}
