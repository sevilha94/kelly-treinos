import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Copia de seguranca do banco inteiro.
 *
 * Ate agora nao existia nenhuma. A carteira de alunos da Kelly, o historico de
 * carga de cada um e as avaliacoes fisicas viviam num lugar so: se aquele banco
 * corrompesse ou a conta fosse perdida, acabou — e nada disso da para refazer
 * de memoria.
 *
 * Sai um arquivo por dia, guardado num balde privado. E JSON de proposito, e
 * nao um despejo do Postgres: assim continua legivel daqui a anos, por qualquer
 * ferramenta, mesmo que o banco por tras mude.
 */

/** Ordem de dependencia: quem e referenciado vem antes de quem referencia. */
export const TABELAS = [
  "configuracao",
  "exercicio",
  "aluno",
  "treino",
  "treino_exercicio",
  "aluno_agenda",
  "aluno_lembrete",
  "aluno_acesso",
  "avaliacao",
  "mensalidade",
  "sessao",
  "sessao_item",
  "painel_lembrete",
] as const;

/** Quantos dias de copia guardar. Alem disso, o arquivo mais antigo sai. */
export const DIAS_GUARDADOS = 30;

export const BALDE = "copias";

export type ResumoDaCopia = {
  arquivo: string;
  linhas: number;
  bytes: number;
  tabelas: Record<string, number>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cliente = SupabaseClient<any, any, any>;

export function nomeDoArquivo(dia: string) {
  return `copia-${dia}.json`;
}

/**
 * Le todas as tabelas e guarda o resultado como um arquivo so.
 *
 * Pagina de mil em mil porque o PostgREST corta a resposta por padrao — sem
 * isso a copia sairia silenciosamente incompleta, que e a pior especie de
 * backup: a que so falha no dia em que voce precisa dela.
 */
export async function gerarCopia(
  supabase: Cliente,
  dia: string,
): Promise<ResumoDaCopia | { erro: string }> {
  const conteudo: Record<string, unknown[]> = {};
  const contagem: Record<string, number> = {};

  for (const tabela of TABELAS) {
    const linhas: unknown[] = [];
    const passo = 1000;

    for (let inicio = 0; ; inicio += passo) {
      const { data, error } = await supabase
        .from(tabela)
        .select("*")
        .range(inicio, inicio + passo - 1);

      if (error) return { erro: `${tabela}: ${error.message}` };
      if (!data?.length) break;

      linhas.push(...data);
      if (data.length < passo) break;
    }

    conteudo[tabela] = linhas;
    contagem[tabela] = linhas.length;
  }

  const texto = JSON.stringify(
    {
      gerada_em: new Date().toISOString(),
      dia,
      formato: 1,
      tabelas: conteudo,
    },
    null,
    2,
  );

  const arquivo = nomeDoArquivo(dia);
  const { error } = await supabase.storage
    .from(BALDE)
    .upload(arquivo, texto, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) return { erro: `envio: ${error.message}` };

  return {
    arquivo,
    linhas: Object.values(contagem).reduce((a, b) => a + b, 0),
    bytes: texto.length,
    tabelas: contagem,
  };
}

/**
 * Apaga copias antigas.
 *
 * Guardar para sempre custa espaco sem comprar seguranca: o que salva e ter a
 * de ontem e a de algumas semanas atras, caso um estrago passe despercebido por
 * uns dias.
 */
export async function limparCopiasAntigas(supabase: Cliente, hoje: string) {
  const { data } = await supabase.storage.from(BALDE).list();
  if (!data?.length) return 0;

  const limite = new Date(`${hoje}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - DIAS_GUARDADOS);

  const velhos = data
    .filter((item) => {
      const dia = item.name.replace(/^copia-|\.json$/g, "");
      return /^\d{4}-\d{2}-\d{2}$/.test(dia) && new Date(`${dia}T00:00:00Z`) < limite;
    })
    .map((item) => item.name);

  if (velhos.length) await supabase.storage.from(BALDE).remove(velhos);
  return velhos.length;
}
