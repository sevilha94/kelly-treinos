"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
