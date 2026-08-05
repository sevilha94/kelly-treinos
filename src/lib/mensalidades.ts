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
};

export type SituacaoMensalidade = {
  texto: string;
  tom: "bom" | "atencao" | "alerta";
  diasDeAtraso: number;
};

export function situacaoMensalidade(
  mensalidade: Mensalidade | undefined,
): SituacaoMensalidade | null {
  if (!mensalidade) return null;

  if (mensalidade.pago_em) {
    return { texto: "Paga", tom: "bom", diasDeAtraso: 0 };
  }

  const atraso = diasAtras(mensalidade.vencimento);

  if (atraso < 0) {
    return {
      texto: `Vence em ${Math.abs(atraso)} ${Math.abs(atraso) === 1 ? "dia" : "dias"}`,
      tom: "bom",
      diasDeAtraso: 0,
    };
  }
  if (atraso === 0) return { texto: "Vence hoje", tom: "atencao", diasDeAtraso: 0 };

  return {
    texto: `${atraso} ${atraso === 1 ? "dia" : "dias"} em atraso`,
    tom: atraso > 5 ? "alerta" : "atencao",
    diasDeAtraso: atraso,
  };
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
 * Se o aluno deve ficar sem ver o treino por atraso. So vale quando a Kelly
 * ligou o bloqueio automatico naquele aluno, e ainda respeita a tolerancia.
 */
export function deveBloquearPorAtraso(
  aluno: { bloquear_por_atraso: boolean; dias_tolerancia: number },
  emAberto: Mensalidade | undefined,
): boolean {
  if (!aluno.bloquear_por_atraso || !emAberto) return false;
  return diasAtras(emAberto.vencimento) > aluno.dias_tolerancia;
}
