"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MEDIDAS } from "@/lib/tipos";
import { copiarTreinos } from "@/lib/copiaPlanilha";
import { competenciaAtual } from "@/lib/mensalidades";

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

/** O banco so aceita de 1 a 28, para o vencimento existir em fevereiro tambem. */
function diaDeVencimento(formData: FormData) {
  const valor = numero(formData, "dia_vencimento");
  if (valor === null) return null;
  return Math.min(28, Math.max(1, Math.round(valor)));
}

/**
 * O banco so aceita descanso entre 0 e 900 segundos. Sem este limite, digitar
 * 1200 fazia a gravacao inteira ser recusada em silencio: a tela voltava igual
 * e a Kelly achava que tinha salvado.
 */
function segundosDeDescanso(formData: FormData) {
  const valor = numero(formData, "descanso_segundos");
  if (valor === null) return null;
  return Math.min(900, Math.max(0, Math.round(valor)));
}

/**
 * Falha de gravacao vira registro no servidor.
 *
 * Ainda nao mostramos o erro na tela — para isso cada formulario precisaria
 * carregar um estado proprio. Mas gravar aqui e a diferenca entre investigar
 * um "nao salvou" com informacao e no escuro.
 */
function conferir(onde: string, erro: { message: string } | null) {
  if (erro) console.error(`[kelly-treinos] falhou em ${onde}: ${erro.message}`);
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
    valor_mensalidade: numero(formData, "valor_mensalidade"),
    dia_vencimento: diaDeVencimento(formData),
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

export async function copiarPlanilha(formData: FormData) {
  const supabase = await exigirLogin();
  const destinoId = String(formData.get("aluno_id") ?? "");
  const origemId = texto(formData, "origem_id");

  if (!origemId) return;

  await copiarTreinos(supabase, origemId, destinoId);

  revalidatePath(`/painel/alunos/${destinoId}`);
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

  const { error } = await supabase.from("treino_exercicio").insert({
    treino_id: treinoId,
    exercicio_id: exercicioId,
    series: texto(formData, "series") ?? "4",
    repeticoes: texto(formData, "repeticoes") ?? "12",
    descanso_segundos: segundosDeDescanso(formData),
    ordem: count ?? 0,
  });
  conferir("adicionarItem", error);

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function salvarItem(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const { error } = await supabase
    .from("treino_exercicio")
    .update({
      // vazio volta a valer o nome da biblioteca
      apelido: texto(formData, "apelido"),
      series: texto(formData, "series") ?? "4",
      repeticoes: texto(formData, "repeticoes") ?? "12",
      observacao: texto(formData, "observacao"),
      descanso_segundos: segundosDeDescanso(formData),
    })
    .eq("id", String(formData.get("item_id") ?? ""));
  conferir("salvarItem", error);

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
// AVALIACAO FISICA
// ---------------------------------------------------------------------------

export async function salvarAvaliacao(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const medidas: Record<string, number | null> = {};
  for (const { campo } of MEDIDAS) medidas[campo] = numero(formData, campo);

  const pesoKg = medidas.peso_kg;
  const alturaCm = numero(formData, "altura_cm");

  const dados = {
    ...medidas,
    aluno_id: alunoId,
    data: texto(formData, "data") ?? new Date().toISOString().slice(0, 10),
    altura_cm: alturaCm,
    observacoes: texto(formData, "observacoes"),
  };

  const id = texto(formData, "avaliacao_id");
  if (id) {
    await supabase.from("avaliacao").update(dados).eq("id", id);
  } else {
    await supabase.from("avaliacao").insert(dados);
  }

  // peso e altura tambem sobem para o cadastro do aluno, que e onde as outras
  // telas leem o valor mais recente
  if (pesoKg || alturaCm) {
    await supabase
      .from("aluno")
      .update({
        ...(pesoKg ? { peso_kg: pesoKg } : {}),
        ...(alturaCm ? { altura_cm: alturaCm } : {}),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", alunoId);
  }

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function arquivarAvaliacao(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  await supabase
    .from("avaliacao")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", String(formData.get("avaliacao_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
}

// ---------------------------------------------------------------------------
// MENSALIDADE
//
// O sistema nao movimenta dinheiro: ela cobra por Pix como sempre e aqui so
// registra o que combinou e o que entrou.
// ---------------------------------------------------------------------------

export async function salvarCobranca(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const dia = numero(formData, "dia_vencimento");

  await supabase
    .from("aluno")
    .update({
      valor_mensalidade: numero(formData, "valor_mensalidade"),
      dia_vencimento: dia ? Math.min(28, Math.max(1, Math.round(dia))) : null,
      bloquear_por_atraso: formData.get("bloquear_por_atraso") === "sim",
      dias_tolerancia: Math.max(0, Math.round(numero(formData, "dias_tolerancia") ?? 5)),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", alunoId);

  revalidatePath(`/painel/alunos/${alunoId}`);
}

export async function gerarMensalidade(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");

  const { data: aluno } = await supabase
    .from("aluno")
    .select("valor_mensalidade, dia_vencimento")
    .eq("id", alunoId)
    .single();

  if (!aluno?.valor_mensalidade) return;

  const competencia = texto(formData, "competencia") ?? competenciaAtual();
  const [ano, mes] = competencia.split("-");
  const dia = String(aluno.dia_vencimento ?? 10).padStart(2, "0");

  await supabase.from("mensalidade").upsert(
    {
      aluno_id: alunoId,
      competencia,
      valor: aluno.valor_mensalidade,
      vencimento: `${ano}-${mes}-${dia}`,
    },
    { onConflict: "aluno_id,competencia" },
  );

  revalidatePath(`/painel/alunos/${alunoId}`);
  revalidatePath("/painel");
}

export async function alternarPagamento(formData: FormData) {
  const supabase = await exigirLogin();
  const alunoId = String(formData.get("aluno_id") ?? "");
  const pagar = formData.get("pagar") === "sim";

  await supabase
    .from("mensalidade")
    .update({
      pago_em: pagar ? new Date().toISOString() : null,
      forma: pagar ? (texto(formData, "forma") ?? "Pix") : null,
    })
    .eq("id", String(formData.get("mensalidade_id") ?? ""));

  revalidatePath(`/painel/alunos/${alunoId}`);
  revalidatePath("/painel");
}

/**
 * A chave Pix que o aluno ve na hora de pagar.
 *
 * Fica em configuracao porque e uma so para todos. O nome do titular vai junto:
 * quem paga para uma chave desconhecida quer conferir o nome antes de confirmar.
 */
export async function salvarChavePix(formData: FormData) {
  const supabase = await exigirLogin();

  await supabase.from("configuracao").upsert(
    [
      {
        chave: "chave_pix",
        valor: texto(formData, "chave_pix") ?? "",
        atualizado_em: new Date().toISOString(),
      },
      {
        chave: "titular_pix",
        valor: texto(formData, "titular_pix") ?? "",
        atualizado_em: new Date().toISOString(),
      },
    ],
    { onConflict: "chave" },
  );

  revalidatePath("/painel");
}

/** Horario em que os lembretes saem, igual para todos os alunos. */
export async function salvarHoraDoLembrete(formData: FormData) {
  const supabase = await exigirLogin();
  const hora = Math.min(23, Math.max(0, Math.round(numero(formData, "hora") ?? 7)));

  await supabase
    .from("configuracao")
    .upsert(
      { chave: "hora_lembrete", valor: String(hora), atualizado_em: new Date().toISOString() },
      { onConflict: "chave" },
    );

  revalidatePath("/painel");
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
