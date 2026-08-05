"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoAluno = { erro?: string };

async function exigirLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return supabase;
}

function texto(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor || null;
}

function numero(formData: FormData, campo: string) {
  const valor = texto(formData, campo);
  if (!valor) return null;
  const convertido = Number(valor.replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}

// ---------------------------------------------------------------------------
// ALUNO
// ---------------------------------------------------------------------------

export async function salvarAluno(
  _anterior: EstadoAluno,
  formData: FormData,
): Promise<EstadoAluno> {
  const supabase = await exigirLogin();

  const id = String(formData.get("id") ?? "").trim();
  const nome = texto(formData, "nome");
  if (!nome) return { erro: "O aluno precisa de um nome." };

  const dados = {
    nome,
    telefone: texto(formData, "telefone"),
    data_nascimento: texto(formData, "data_nascimento"),
    peso_kg: numero(formData, "peso_kg"),
    altura_cm: numero(formData, "altura_cm"),
    objetivo: texto(formData, "objetivo"),
    observacoes: texto(formData, "observacoes"),
    atualizado_em: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("aluno").update(dados).eq("id", id);
    if (error) return { erro: "Não consegui salvar. Tente de novo." };
    revalidatePath(`/painel/alunos/${id}`);
    redirect(`/painel/alunos/${id}`);
  }

  const { data, error } = await supabase
    .from("aluno")
    .insert(dados)
    .select("id")
    .single();

  if (error || !data) return { erro: "Não consegui cadastrar. Tente de novo." };

  // toda planilha começa com os quatro treinos da folha da Kelly
  await supabase.from("treino").insert(
    ["A", "B", "C", "D"].map((letra, indice) => ({
      aluno_id: data.id,
      letra,
      titulo: "A definir",
      ordem: indice,
    })),
  );

  revalidatePath("/painel/alunos");
  redirect(`/painel/alunos/${data.id}`);
}

/** Pausa ou libera o acesso do aluno sem trocar o link dele. */
export async function alternarAcesso(formData: FormData) {
  const supabase = await exigirLogin();
  const id = String(formData.get("id") ?? "");
  const bloquear = formData.get("bloquear") === "sim";

  await supabase
    .from("aluno")
    .update({ acesso_bloqueado_em: bloquear ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath(`/painel/alunos/${id}`);
}

/** Troca o token: o link antigo deixa de existir, inclusive para quem o copiou. */
export async function gerarNovoLink(formData: FormData) {
  const supabase = await exigirLogin();
  const id = String(formData.get("id") ?? "");

  const token = crypto.randomUUID().replaceAll("-", "");
  await supabase.from("aluno").update({ token_link: token }).eq("id", id);

  revalidatePath(`/painel/alunos/${id}`);
}

export async function arquivarAluno(formData: FormData) {
  const supabase = await exigirLogin();
  await supabase
    .from("aluno")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", String(formData.get("id") ?? ""));

  revalidatePath("/painel/alunos");
  redirect("/painel/alunos");
}

// ---------------------------------------------------------------------------
// TREINO
// ---------------------------------------------------------------------------

export async function salvarTreino(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  await supabase
    .from("treino")
    .update({
      letra: String(formData.get("letra") ?? "").trim() || "A",
      titulo: texto(formData, "titulo") ?? "A definir",
    })
    .eq("id", String(formData.get("treino_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function criarTreino(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const { count } = await supabase
    .from("treino")
    .select("id", { count: "exact", head: true })
    .eq("aluno_id", alunoId)
    .is("arquivado_em", null);

  const total = count ?? 0;
  await supabase.from("treino").insert({
    aluno_id: alunoId,
    letra: String.fromCharCode(65 + total),
    titulo: "A definir",
    ordem: total,
  });

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function arquivarTreino(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  await supabase
    .from("treino")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", String(formData.get("treino_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
}

// ---------------------------------------------------------------------------
// EXERCICIOS DENTRO DO TREINO
// ---------------------------------------------------------------------------

export async function adicionarItem(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");
  const treinoId = String(formData.get("treino_id") ?? "");
  const exercicioId = texto(formData, "exercicio_id");

  if (!exercicioId) return;

  const { count } = await supabase
    .from("treino_exercicio")
    .select("id", { count: "exact", head: true })
    .eq("treino_id", treinoId)
    .is("arquivado_em", null);

  await supabase.from("treino_exercicio").insert({
    treino_id: treinoId,
    exercicio_id: exercicioId,
    series: texto(formData, "series") ?? "4",
    repeticoes: texto(formData, "repeticoes") ?? "12",
    ordem: count ?? 0,
  });

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function salvarItem(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  await supabase
    .from("treino_exercicio")
    .update({
      // vazio volta a valer o nome da biblioteca
      apelido: texto(formData, "apelido"),
      series: texto(formData, "series") ?? "4",
      repeticoes: texto(formData, "repeticoes") ?? "12",
      observacao: texto(formData, "observacao"),
    })
    .eq("id", String(formData.get("item_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function removerItem(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  await supabase
    .from("treino_exercicio")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", String(formData.get("item_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function moverItem(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  const direcao = String(formData.get("direcao") ?? "");

  const { data: item } = await supabase
    .from("treino_exercicio")
    .select("id, treino_id, ordem")
    .eq("id", itemId)
    .single();

  if (!item) return;

  const { data: vizinho } = await supabase
    .from("treino_exercicio")
    .select("id, ordem")
    .eq("treino_id", item.treino_id)
    .is("arquivado_em", null)
    .order("ordem", { ascending: direcao !== "cima" })
    .filter("ordem", direcao === "cima" ? "lt" : "gt", item.ordem)
    .limit(1)
    .maybeSingle();

  if (!vizinho) return;

  await supabase
    .from("treino_exercicio")
    .update({ ordem: vizinho.ordem })
    .eq("id", item.id);
  await supabase
    .from("treino_exercicio")
    .update({ ordem: item.ordem })
    .eq("id", vizinho.id);

  revalidatePath(`/painel/alunos/${alunoId}`);
}

// ---------------------------------------------------------------------------
// AGENDA DA SEMANA
// ---------------------------------------------------------------------------

export async function salvarAgenda(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const linhas = [];
  for (let dia = 1; dia <= 7; dia++) {
    linhas.push({
      aluno_id: alunoId,
      dia_semana: dia,
      treino_id: texto(formData, `dia_${dia}`),
    });
  }

  await supabase.from("aluno_agenda").upsert(linhas, {
    onConflict: "aluno_id,dia_semana",
  });

  revalidatePath(`/painel/alunos/${alunoId}`);
}
