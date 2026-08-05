import type { SupabaseClient } from "@supabase/supabase-js";

export type MarcaDeCarga = { data: string; carga: number };

/** Quanto tempo de historico vale mostrar para o aluno. */
const JANELA_DIAS = 120;
const MAX_SESSOES = 200;

/**
 * Historico de carga de cada exercicio do aluno, do mais recente para o mais
 * antigo. `ignorarData` serve para tirar o dia de hoje da conta, para que
 * "ultima vez" signifique o treino anterior e nao o que ele acabou de digitar.
 */
export async function historicoDeCargas(
  supabase: SupabaseClient,
  alunoId: string,
  ignorarData?: string,
): Promise<Map<string, MarcaDeCarga[]>> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const { data: sessoes } = await supabase
    .from("sessao")
    .select("id, data")
    .eq("aluno_id", alunoId)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: false })
    .limit(MAX_SESSOES);

  const dataPorSessao = new Map<string, string>();
  for (const sessao of sessoes ?? []) {
    if (ignorarData && sessao.data === ignorarData) continue;
    dataPorSessao.set(sessao.id, sessao.data);
  }

  const historico = new Map<string, MarcaDeCarga[]>();
  if (dataPorSessao.size === 0) return historico;

  const { data: itens } = await supabase
    .from("sessao_item")
    .select("treino_exercicio_id, carga_kg, sessao_id")
    .in("sessao_id", [...dataPorSessao.keys()])
    .not("carga_kg", "is", null);

  for (const item of itens ?? []) {
    const data = dataPorSessao.get(item.sessao_id);
    if (!data) continue;

    const lista = historico.get(item.treino_exercicio_id) ?? [];
    lista.push({ data, carga: Number(item.carga_kg) });
    historico.set(item.treino_exercicio_id, lista);
  }

  for (const lista of historico.values()) {
    lista.sort((a, b) => (a.data < b.data ? 1 : -1));
  }

  return historico;
}

/** Formata sem casa decimal quando o numero e redondo: 30 kg, nao 30,0 kg. */
export function formataCarga(carga: number): string {
  const arredondado = Math.round(carga * 10) / 10;
  return Number.isInteger(arredondado)
    ? String(arredondado)
    : arredondado.toFixed(1).replace(".", ",");
}
