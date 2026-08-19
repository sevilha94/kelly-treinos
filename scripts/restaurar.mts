/**
 * Restaura uma copia de seguranca de volta para o banco.
 *
 * Existe porque copia que nunca foi restaurada e suposicao, nao e copia. O dia
 * de descobrir que o caminho de volta nao funciona nao pode ser o dia do
 * desastre — entao este arquivo e o ensaio, e fica guardado para a hora real.
 *
 * COMO USAR
 *
 *   # so compara, nao escreve nada — comece sempre por aqui
 *   node --import ./testes/preparar.mjs scripts/restaurar.mts --conferir
 *
 *   # escreve de verdade
 *   node --import ./testes/preparar.mjs scripts/restaurar.mts --restaurar
 *
 * Opcoes:
 *   --copia <nome>     qual copia usar (padrao: a mais recente do deposito)
 *   --arquivo <path>   usa um arquivo local em vez do deposito
 *   --tabela <nome>    limita a uma tabela (pode repetir)
 *   --aluno <id>       limita as linhas daquele aluno (para ensaio)
 *
 * Precisa das variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { BALDE, TABELAS } from "../src/lib/copiaDeSeguranca.ts";

/** Por qual coluna cada tabela se identifica — errar aqui duplica em vez de repor. */
const CHAVE: Record<string, string> = {
  configuracao: "chave",
  aluno_agenda: "aluno_id,dia_semana",
  aluno_acesso: "aluno_id,dispositivo_id",
};
const CHAVE_PADRAO = "id";

/** Colunas que ligam a linha a um aluno, para o modo de ensaio. */
const COLUNA_DO_ALUNO: Record<string, string> = {
  aluno: "id",
  treino: "aluno_id",
  aluno_agenda: "aluno_id",
  aluno_lembrete: "aluno_id",
  aluno_acesso: "aluno_id",
  avaliacao: "aluno_id",
  mensalidade: "aluno_id",
  sessao: "aluno_id",
};

type Linha = Record<string, unknown>;

function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const temBandeira = (nome: string) => process.argv.includes(`--${nome}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SECRET_KEY;
if (!url || !chave) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, chave, { auth: { persistSession: false } });

async function lerCopia(): Promise<{ nome: string; tabelas: Record<string, Linha[]> }> {
  const local = argumento("arquivo");
  if (local) {
    const texto = await readFile(local, "utf8");
    return { nome: local, ...JSON.parse(texto) };
  }

  let nome = argumento("copia");
  if (!nome) {
    const { data } = await supabase.storage
      .from(BALDE)
      .list("", { limit: 1, sortBy: { column: "name", order: "desc" } });
    nome = data?.[0]?.name;
    if (!nome) throw new Error("nenhuma cópia no depósito");
  }

  const { data, error } = await supabase.storage.from(BALDE).download(nome);
  if (error || !data) throw new Error(`não consegui baixar ${nome}: ${error?.message}`);

  return { nome, ...JSON.parse(await data.text()) };
}

/** Compara o que esta no banco com o que a copia diz que deveria estar. */
function diferencas(daCopia: Linha[], doBanco: Linha[], chaveDaTabela: string) {
  const colunas = chaveDaTabela.split(",");
  const idDe = (linha: Linha) => colunas.map((c) => String(linha[c])).join("|");

  const banco = new Map(doBanco.map((l) => [idDe(l), l]));
  const faltando: string[] = [];
  const diferente: string[] = [];

  for (const linha of daCopia) {
    const atual = banco.get(idDe(linha));
    if (!atual) {
      faltando.push(idDe(linha));
      continue;
    }
    for (const [coluna, valor] of Object.entries(linha)) {
      if (JSON.stringify(atual[coluna]) !== JSON.stringify(valor)) {
        diferente.push(`${idDe(linha)}.${coluna}`);
        break;
      }
    }
  }

  return { faltando, diferente, aMais: doBanco.length - (daCopia.length - faltando.length) };
}

const copia = await lerCopia();
const soTabelas = process.argv.reduce<string[]>((acc, arg, i) => {
  if (arg === "--tabela") acc.push(process.argv[i + 1]);
  return acc;
}, []);
const soAluno = argumento("aluno");
const escrever = temBandeira("restaurar");

if (!escrever && !temBandeira("conferir")) {
  console.error("Escolha --conferir (não escreve) ou --restaurar.");
  process.exit(1);
}

console.log(`cópia: ${copia.nome}`);
console.log(`modo : ${escrever ? "RESTAURAR (escreve no banco)" : "conferir (não escreve)"}`);
if (soAluno) console.log(`aluno: ${soAluno}`);
console.log("");

let problemas = 0;

for (const tabela of TABELAS) {
  if (soTabelas.length && !soTabelas.includes(tabela)) continue;

  let linhas = (copia.tabelas[tabela] ?? []) as Linha[];

  if (soAluno) {
    const coluna = COLUNA_DO_ALUNO[tabela];
    if (!coluna) continue;
    linhas = linhas.filter((l) => l[coluna] === soAluno);
  }

  if (!linhas.length) continue;

  const chaveDaTabela = CHAVE[tabela] ?? CHAVE_PADRAO;

  if (escrever) {
    // em lotes: mandar milhares de linhas de uma vez estoura o limite do pedido
    for (let i = 0; i < linhas.length; i += 500) {
      const { error } = await supabase
        .from(tabela)
        .upsert(linhas.slice(i, i + 500), { onConflict: chaveDaTabela });
      if (error) {
        console.log(`  ✗ ${tabela}: ${error.message}`);
        problemas++;
        break;
      }
    }
  }

  // confere sempre, inclusive depois de escrever: o que importa nao e o upsert
  // ter voltado sem erro, e o banco estar igual a copia
  let consulta = supabase.from(tabela).select("*");
  if (soAluno && COLUNA_DO_ALUNO[tabela]) {
    consulta = consulta.eq(COLUNA_DO_ALUNO[tabela], soAluno);
  }
  const { data: doBanco, error } = await consulta;
  if (error) {
    console.log(`  ✗ ${tabela}: não consegui reler — ${error.message}`);
    problemas++;
    continue;
  }

  const d = diferencas(linhas, (doBanco ?? []) as Linha[], chaveDaTabela);
  const ok = d.faltando.length === 0 && d.diferente.length === 0;
  if (!ok) problemas++;

  console.log(
    `  ${ok ? "✓" : "✗"} ${tabela.padEnd(18)} ${String(linhas.length).padStart(4)} linhas` +
      (d.faltando.length ? ` · ${d.faltando.length} faltando` : "") +
      (d.diferente.length ? ` · ${d.diferente.length} diferentes` : ""),
  );

  if (d.faltando.length) console.log(`      faltando: ${d.faltando.slice(0, 3).join(", ")}`);
  if (d.diferente.length) console.log(`      diferente: ${d.diferente.slice(0, 3).join(", ")}`);
}

console.log("");
console.log(
  problemas === 0
    ? "Banco confere com a cópia."
    : `${problemas} tabela(s) fora do esperado.`,
);
process.exit(problemas === 0 ? 0 : 1);
