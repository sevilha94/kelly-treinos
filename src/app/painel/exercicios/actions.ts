"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EXERCICIOS_COMUNS } from "@/lib/exerciciosComuns";

export type EstadoExercicio = { erro?: string };

async function exigirLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return supabase;
}

export async function salvarExercicio(
  _anterior: EstadoExercicio,
  formData: FormData,
): Promise<EstadoExercicio> {
  const supabase = await exigirLogin();

  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const grupo = String(formData.get("grupo_muscular") ?? "").trim();

  if (!nome) return { erro: "O exercício precisa de um nome." };
  if (!grupo) return { erro: "Escolha o grupo muscular." };

  const dados = {
    nome,
    grupo_muscular: grupo,
    midia_url: String(formData.get("midia_url") ?? "").trim() || null,
    dica: String(formData.get("dica") ?? "").trim() || null,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("exercicio").update(dados).eq("id", id)
    : await supabase.from("exercicio").insert(dados);

  if (error) return { erro: "Não consegui salvar. Tente de novo." };

  revalidatePath("/painel/exercicios");
  if (id) redirect("/painel/exercicios");
  return {};
}

/**
 * Preenche a biblioteca com os exercicios comuns de academia.
 *
 * So entra o que ainda nao existe, comparando pelo nome sem acento e sem
 * maiuscula — assim "Supino Reto Barra" digitado a mao nao vira duplicata de
 * "Supino reto barra". Rodar duas vezes nao faz estrago.
 */
export async function preencherBiblioteca(): Promise<void> {
  const supabase = await exigirLogin();

  const { data: existentes } = await supabase
    .from("exercicio")
    .select("nome")
    .is("arquivado_em", null);

  const jaTem = new Set(
    (existentes ?? []).map((linha) => chaveDoNome(linha.nome)),
  );

  const novos = EXERCICIOS_COMUNS.filter(
    ({ nome }) => !jaTem.has(chaveDoNome(nome)),
  ).map(({ nome, grupo }) => ({
    nome,
    grupo_muscular: grupo,
    midia_url: null,
    dica: null,
  }));

  if (novos.length > 0) {
    await supabase.from("exercicio").insert(novos);
  }

  revalidatePath("/painel/exercicios");
  revalidatePath("/painel");
}

function chaveDoNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export async function arquivarExercicio(formData: FormData) {
  const supabase = await exigirLogin();
  const id = String(formData.get("id") ?? "");

  await supabase
    .from("exercicio")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/painel/exercicios");
  redirect("/painel/exercicios");
}
