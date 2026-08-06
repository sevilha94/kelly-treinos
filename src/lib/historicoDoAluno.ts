import type { SupabaseClient } from "@supabase/supabase-js";
import type { Percepcao } from "./sessoes";

export type TreinoFeito = {
  data: string;
  letra: string;
  titulo: string;
  percepcao: Percepcao | null;
  comentario: string | null;
};

export type EvolucaoDeExercicio = {
  nome: string;
  grupo: string;
  primeira: { data: string; carga: number };
  ultima: { data: string; carga: number };
  vezes: number;
};

export type HistoricoDoAluno = {
  treinos: TreinoFeito[];
  evolucao: EvolucaoDeExercicio[];
  porSemana: { semana: string; treinos: number }[];
};

const JANELA_DIAS = 180;

/**
 * O que o aluno fez ao longo do tempo, do jeito que a Kelly precisa para
 * decidir o proximo passo: o que ele achou dos treinos e onde a carga andou
 * ou empacou.
 */
export async function historicoDoAluno(
  supabase: SupabaseClient,
  alunoId: string,
): Promise<HistoricoDoAluno> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const { data: sessoes } = await supabase
    .from("sessao")
    .select(
      "id, data, finalizada_em, percepcao, comentario, treino:treino_id(letra, titulo)",
    )
    .eq("aluno_id", alunoId)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: false });

  const vazio: HistoricoDoAluno = { treinos: [], evolucao: [], porSemana: [] };
  if (!sessoes?.length) return vazio;

  const treinos: TreinoFeito[] = sessoes
    .filter((s) => s.finalizada_em)
    .map((s) => {
      const treino = s.treino as unknown as {
        letra: string;
        titulo: string;
      } | null;
      return {
        data: s.data,
        letra: treino?.letra ?? "?",
        titulo: treino?.titulo ?? "",
        percepcao: s.percepcao,
        comentario: s.comentario,
      };
    });

  const { data: itens } = await supabase
    .from("sessao_item")
    .select(
      "sessao_id, carga_kg, item:treino_exercicio_id(exercicio:exercicio_id(nome, grupo_muscular))",
    )
    .in(
      "sessao_id",
      sessoes.map((s) => s.id),
    )
    .not("carga_kg", "is", null);

  const dataPorSessao = new Map(sessoes.map((s) => [s.id, s.data as string]));
  const porExercicio = new Map<string, { data: string; carga: number }[]>();
  const grupoDe = new Map<string, string>();

  for (const item of itens ?? []) {
    const ligacao = item.item as unknown as {
      exercicio: { nome: string; grupo_muscular: string } | null;
    } | null;
    const exercicio = ligacao?.exercicio;
    const data = dataPorSessao.get(item.sessao_id);
    if (!exercicio || !data) continue;

    grupoDe.set(exercicio.nome, exercicio.grupo_muscular);
    const lista = porExercicio.get(exercicio.nome) ?? [];
    lista.push({ data, carga: Number(item.carga_kg) });
    porExercicio.set(exercicio.nome, lista);
  }

  const evolucao: EvolucaoDeExercicio[] = [];
  for (const [nome, marcas] of porExercicio) {
    // do mais antigo para o mais recente, para "primeira" e "ultima" baterem
    marcas.sort((a, b) => (a.data < b.data ? -1 : 1));
    evolucao.push({
      nome,
      grupo: grupoDe.get(nome) ?? "",
      primeira: marcas[0],
      ultima: marcas[marcas.length - 1],
      vezes: marcas.length,
    });
  }

  // quem mais evoluiu primeiro; empate desempata por quem ele mais treinou
  evolucao.sort((a, b) => {
    const ganhoA = a.ultima.carga - a.primeira.carga;
    const ganhoB = b.ultima.carga - b.primeira.carga;
    return ganhoB - ganhoA || b.vezes - a.vezes;
  });

  return { treinos, evolucao, porSemana: agruparPorSemana(treinos) };
}

/** Ultimas oito semanas, da mais antiga para a mais recente. */
function agruparPorSemana(treinos: TreinoFeito[]) {
  const contagem = new Map<string, number>();

  for (const treino of treinos) {
    const dia = new Date(`${treino.data}T00:00:00`);
    // recua ate a segunda-feira daquela semana
    const diaDaSemana = (dia.getDay() + 6) % 7;
    dia.setDate(dia.getDate() - diaDaSemana);
    const chave = dia.toISOString().slice(0, 10);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const semanas: { semana: string; treinos: number }[] = [];
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));

  for (let i = 7; i >= 0; i--) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() - i * 7);
    const chave = dia.toISOString().slice(0, 10);
    semanas.push({ semana: chave, treinos: contagem.get(chave) ?? 0 });
  }

  return semanas;
}
