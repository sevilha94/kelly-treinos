import type { SupabaseClient } from "@supabase/supabase-js";
import { diasAtras } from "./tipos";

export type Mensalidade = {
  id: string;
  aluno_id: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  forma: string | null;
  observacoes: string | null;
  /** Caminho do comprovante no armazenamento; nunca uma URL publica. */
  comprovante_caminho: string | null;
  enviado_em: string | null;
};

/** Dias de atraso em que a cobranca muda de patamar. */
export const DIAS_CRITICO = 5;
export const DIAS_BLOQUEIO = 7;

/**
 * Quantos dias antes do vencimento a cobranca e criada e passa a aparecer para
 * o aluno. Antes disso ele nao precisa pensar nisso; a tela dele e de treino.
 */
export const DIAS_DE_ANTECEDENCIA = 5;

/**
 * Se o aluno deve ver a cobranca agora.
 *
 * Some assim que ele envia o comprovante e so volta no proximo ciclo. Quem esta
 * em dia abre o aplicativo para treinar, nao para ser lembrado de dinheiro.
 */
export function deveMostrarCobranca(
  emAberto: Mensalidade | undefined,
): emAberto is Mensalidade {
  if (!emAberto || emAberto.pago_em || emAberto.enviado_em) return false;
  return diasAtras(emAberto.vencimento) >= -DIAS_DE_ANTECEDENCIA;
}

/**
 * Comprovante enviado hoje.
 *
 * Serve para o aluno ainda ver o "recebido, obrigado" na visita em que enviou,
 * em vez de o bloco sumir do nada. Amanha ja nao aparece.
 */
export function enviadoHoje(emAberto: Mensalidade | undefined): boolean {
  if (!emAberto?.enviado_em || emAberto.pago_em) return false;
  return emAberto.enviado_em.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

/**
 * O vencimento daquele aluno no mes de uma data.
 * Dia limitado a 28 no cadastro, entao existe em qualquer mes.
 */
export function vencimentoNoMes(dia: number, referencia: string): string {
  return `${referencia.slice(0, 7)}-${String(dia).padStart(2, "0")}`;
}

export type Nivel =
  | "paga"
  | "conferir"
  | "em_dia"
  | "atrasada"
  | "critica"
  | "bloqueada";

export const ROTULO_NIVEL: Record<Nivel, string> = {
  paga: "Paga",
  conferir: "Comprovante para conferir",
  em_dia: "Em dia",
  atrasada: "Atrasada",
  critica: "Atraso crítico",
  bloqueada: "Acesso pausado",
};

/**
 * Em que patamar a cobranca esta.
 *
 * Comprovante enviado tira o aluno da regua mesmo antes de a Kelly conferir:
 * ele fez a parte dele, e travar o treino de quem pagou por causa da fila de
 * conferencia dela seria punir a pessoa errada.
 */
export function nivelDaMensalidade(mensalidade: Mensalidade | undefined): {
  nivel: Nivel;
  diasDeAtraso: number;
} {
  if (!mensalidade) return { nivel: "em_dia", diasDeAtraso: 0 };
  if (mensalidade.pago_em) return { nivel: "paga", diasDeAtraso: 0 };

  const atraso = Math.max(0, diasAtras(mensalidade.vencimento));

  if (mensalidade.enviado_em) return { nivel: "conferir", diasDeAtraso: atraso };
  if (atraso === 0) return { nivel: "em_dia", diasDeAtraso: 0 };
  if (atraso >= DIAS_BLOQUEIO) return { nivel: "bloqueada", diasDeAtraso: atraso };
  if (atraso >= DIAS_CRITICO) return { nivel: "critica", diasDeAtraso: atraso };
  return { nivel: "atrasada", diasDeAtraso: atraso };
}

/** Primeiro dia do mes atual, no formato do banco. */
export function competenciaAtual(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-01`;
}

export function nomeDaCompetencia(competencia: string): string {
  const [ano, mes] = competencia.slice(0, 10).split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${meses[Number(mes) - 1]} de ${ano}`;
}

/** A mensalidade em aberto mais antiga de cada aluno. */
export async function emAbertoPorAluno(
  supabase: SupabaseClient,
): Promise<Map<string, Mensalidade>> {
  const { data } = await supabase
    .from("mensalidade")
    .select("*")
    .is("pago_em", null)
    .is("arquivado_em", null)
    .order("vencimento");

  const mapa = new Map<string, Mensalidade>();
  for (const linha of (data ?? []) as Mensalidade[]) {
    if (!mapa.has(linha.aluno_id)) mapa.set(linha.aluno_id, linha);
  }
  return mapa;
}

/**
 * Se o aluno deve ficar sem ver o treino por atraso.
 *
 * Tres saidas para ele evitar isso: pagar e a Kelly confirmar, anexar o
 * comprovante, ou ela desligar o bloqueio naquele aluno. Enquanto houver
 * comprovante enviado, o treino continua liberado mesmo sem confirmacao.
 */
export function deveBloquearPorAtraso(
  aluno: { bloquear_por_atraso: boolean; dias_tolerancia: number },
  emAberto: Mensalidade | undefined,
): boolean {
  if (!aluno.bloquear_por_atraso || !emAberto) return false;
  // paga nao deveria chegar aqui, ja que as consultas filtram por pago_em nulo
  // — mas quem confia nisso deixa um aluno em dia sem treino no dia em que
  // alguem mudar a consulta
  if (emAberto.pago_em || emAberto.enviado_em) return false;
  return (
    diasAtras(emAberto.vencimento) >= (aluno.dias_tolerancia ?? DIAS_BLOQUEIO)
  );
}
