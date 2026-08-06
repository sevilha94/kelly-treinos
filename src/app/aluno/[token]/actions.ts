"use server";

import { revalidatePath } from "next/cache";
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
