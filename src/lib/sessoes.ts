import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarcaDeCarga } from "./cargas";

export type Marcacao = { feito: boolean; carga_kg: number | null };

export type Sessoes = {
  /** Quando o aluno finalizou o treino de hoje, se finalizou. */
  finalizadaEm: string | null;
  /** O que ele marcou hoje, por exercicio da planilha. */
  marcacoes: Map<string, Marcacao>;
  /** Cargas anteriores de cada exercicio, da mais recente para a mais antiga. */
  historico: Map<string, MarcaDeCarga[]>;
};

const JANELA_DIAS = 120;
const MAX_SESSOES = 200;

/**
 * Traz de uma vez tudo o que a tela do aluno precisa saber sobre treinos
 * passados e sobre o de hoje.
 *
 * Antes isso eram quatro consultas em duas etapas — o historico e as marcacoes
 * de hoje saem das mesmas tabelas, entao buscar separado era ida e volta a toa.
 * Como o servidor fala com o banco pela rede, cada etapa a menos aparece no
 * tempo que o aluno espera a pagina abrir.
 */
export async function carregarSessoes(
  supabase: SupabaseClient,
  alunoId: string,
  treinoId: string,
  hoje: string,
): Promise<Sessoes> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const { data: sessoes } = await supabase
    .from("sessao")
    .select("id, data, treino_id, finalizada_em")
    .eq("aluno_id", alunoId)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: false })
    .limit(MAX_SESSOES);

  const vazio: Sessoes = {
    finalizadaEm: null,
    marcacoes: new Map(),
    historico: new Map(),
  };
  if (!sessoes?.length) return vazio;

  const deHoje = sessoes.find(
    (s) => s.data === hoje && s.treino_id === treinoId,
  );

  const { data: itens } = await supabase
    .from("sessao_item")
    .select("sessao_id, treino_exercicio_id, feito, carga_kg")
    .in(
      "sessao_id",
      sessoes.map((s) => s.id),
    );

  const dataPorSessao = new Map(sessoes.map((s) => [s.id, s.data as string]));
  const marcacoes = new Map<string, Marcacao>();
  const historico = new Map<string, MarcaDeCarga[]>();

  for (const item of itens ?? []) {
    if (deHoje && item.sessao_id === deHoje.id) {
      marcacoes.set(item.treino_exercicio_id, {
        feito: item.feito,
        carga_kg: item.carga_kg,
      });
    }

    const data = dataPorSessao.get(item.sessao_id);
    // o dia de hoje fica fora do historico: "ultima vez" tem que ser o treino
    // anterior, nao o que ele acabou de digitar
    if (!data || data === hoje || item.carga_kg === null) continue;

    const lista = historico.get(item.treino_exercicio_id) ?? [];
    lista.push({ data, carga: Number(item.carga_kg) });
    historico.set(item.treino_exercicio_id, lista);
  }

  for (const lista of historico.values()) {
    lista.sort((a, b) => (a.data < b.data ? 1 : -1));
  }

  return {
    finalizadaEm: deHoje?.finalizada_em ?? null,
    marcacoes,
    historico,
  };
}
