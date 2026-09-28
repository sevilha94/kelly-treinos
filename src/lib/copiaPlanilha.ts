import type { SupabaseClient } from "@supabase/supabase-js";

export type ResultadoDaCopia = {
  treinosCopiados: number;
  exerciciosCopiados: number;
  treinosVaziosArquivados: number;
};

/**
 * Copia os treinos de um aluno para outro, com exercicios, series e apelidos.
 *
 * Os treinos vazios do destino sao arquivados no caminho: sao os A/B/C/D que o
 * sistema cria sozinho no cadastro, e deixa-los geraria letras repetidas.
 * Treino que ja tem exercicio nunca e mexido — a copia entra depois dele.
 */
export async function copiarTreinos(
  supabase: SupabaseClient,
  origemId: string,
  destinoId: string,
): Promise<ResultadoDaCopia> {
  const vazio = {
    treinosCopiados: 0,
    exerciciosCopiados: 0,
    treinosVaziosArquivados: 0,
  };

  if (!origemId || origemId === destinoId) return vazio;

  const { data: treinosOrigem } = await supabase
    .from("treino")
    .select(
      `letra, titulo, ordem,
       itens:treino_exercicio(exercicio_id, apelido, series, repeticoes, observacao, descanso_segundos, ordem)`,
    )
    .eq("aluno_id", origemId)
    .is("arquivado_em", null)
    .is("itens.arquivado_em", null)
    .order("ordem");

  if (!treinosOrigem?.length) return vazio;

  const { data: treinosDestino } = await supabase
    .from("treino")
    .select("id, letra, ordem, itens:treino_exercicio(id)")
    .eq("aluno_id", destinoId)
    .is("arquivado_em", null)
    .is("itens.arquivado_em", null);

  const agora = new Date().toISOString();
  const resultado = { ...vazio };
  let proximaOrdem = 0;
  const usadas = new Set<string>();

  for (const treino of treinosDestino ?? []) {
    if (treino.itens.length === 0) {
      await supabase
        .from("treino")
        .update({ arquivado_em: agora })
        .eq("id", treino.id);
      await supabase.from("aluno_agenda").delete().eq("treino_id", treino.id);
      resultado.treinosVaziosArquivados += 1;
    } else {
      proximaOrdem = Math.max(proximaOrdem, treino.ordem + 1);
      usadas.add(treino.letra);
    }
  }

  for (const treino of treinosOrigem) {
    const { data: novo } = await supabase
      .from("treino")
      .insert({
        aluno_id: destinoId,
        letra: letraLivre(usadas, treino.letra),
        titulo: treino.titulo,
        ordem: proximaOrdem++,
      })
      .select("id")
      .single();

    if (!novo) continue;
    resultado.treinosCopiados += 1;
    if (treino.itens.length === 0) continue;

    const { error } = await supabase.from("treino_exercicio").insert(
      treino.itens.map((item) => ({
        treino_id: novo.id,
        exercicio_id: item.exercicio_id,
        apelido: item.apelido,
        series: item.series,
        repeticoes: item.repeticoes,
        observacao: item.observacao,
        descanso_segundos: item.descanso_segundos,
        ordem: item.ordem,
      })),
    );
    if (!error) resultado.exerciciosCopiados += treino.itens.length;
  }

  return resultado;
}

/**
 * A letra pedida, ou a primeira que o aluno ainda nao usa.
 *
 * Letra repetida deixava um dos treinos inalcancavel: a tela do aluno acha o
 * treino pela letra e sempre abria o primeiro.
 */
export function letraLivre(usadas: Set<string>, preferida?: string): string {
  let letra = preferida && !usadas.has(preferida) ? preferida : "A";
  while (usadas.has(letra)) letra = String.fromCharCode(letra.charCodeAt(0) + 1);
  usadas.add(letra);
  return letra;
}
