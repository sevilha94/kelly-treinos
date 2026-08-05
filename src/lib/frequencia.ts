import type { SupabaseClient } from "@supabase/supabase-js";
import { diasAtras } from "./tipos";

export type Frequencia = {
  /** Data do ultimo treino finalizado (AAAA-MM-DD), ou null se nao houver. */
  ultimoTreino: string | null;
  diasSemTreinar: number | null;
  treinosNoMes: number;
};

/** Alem disso o aluno conta como "sem treino recente" — nao vale carregar mais. */
const JANELA_DIAS = 180;

export async function frequenciaPorAluno(
  supabase: SupabaseClient,
): Promise<Map<string, Frequencia>> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const { data } = await supabase
    .from("sessao")
    .select("aluno_id, data")
    .not("finalizada_em", "is", null)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: false });

  const mapa = new Map<string, Frequencia>();

  for (const linha of data ?? []) {
    const atual = mapa.get(linha.aluno_id) ?? {
      ultimoTreino: null,
      diasSemTreinar: null,
      treinosNoMes: 0,
    };

    // a consulta ja vem da mais recente para a mais antiga
    if (!atual.ultimoTreino) {
      atual.ultimoTreino = linha.data;
      atual.diasSemTreinar = diasAtras(linha.data);
    }
    if (diasAtras(linha.data) <= 30) atual.treinosNoMes += 1;

    mapa.set(linha.aluno_id, atual);
  }

  return mapa;
}

/** Como a ausencia deve ser lida na tela. */
export function situacao(freq: Frequencia | undefined) {
  const dias = freq?.diasSemTreinar;

  if (dias === null || dias === undefined) {
    return { texto: "Nunca treinou", tom: "alerta" as const };
  }
  if (dias === 0) return { texto: "Treinou hoje", tom: "bom" as const };
  if (dias === 1) return { texto: "Treinou ontem", tom: "bom" as const };
  if (dias <= 7) return { texto: `Há ${dias} dias`, tom: "bom" as const };
  if (dias <= 14) return { texto: `Há ${dias} dias`, tom: "atencao" as const };
  return { texto: `Há ${dias} dias`, tom: "alerta" as const };
}

export const TOM_CLASSE = {
  bom: "text-fumaca",
  atencao: "text-amber-400",
  alerta: "text-sangue-claro",
} as const;
