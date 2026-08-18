/**
 * Leitura da carga do jeito que o aluno digita.
 *
 * Na academia se escreve "12kg", "12,5", "12.5" e ate "12 kg". Antes, qualquer
 * coisa que nao fosse numero puro virava nulo sem avisar: o aluno registrava o
 * peso, a tela recarregava e o numero tinha sumido. Como a evolucao de carga e
 * o unico historico que ele constroi sozinho, sumir calado era o pior desfecho.
 */

/** 1000 kg cobre com folga qualquer aparelho; acima disso e digito sobrando. */
export const CARGA_MAXIMA = 1000;

export type Carga = { valor: number | null; invalida: boolean };

export function leCarga(bruto: string): Carga {
  const limpo = bruto.trim();
  if (!limpo) return { valor: null, invalida: false };

  // negativo nao existe em carga, e o sinal seria descartado pela leitura
  // abaixo, virando um numero positivo que o aluno nao digitou
  if (limpo.startsWith("-")) return { valor: null, invalida: true };

  // vale o PRIMEIRO numero, e nao "todos os digitos grudados". Apagar as letras
  // e juntar o resto transformava "12x10" em 1210 kg — um numero que ninguem
  // digitou entrando no historico como se fosse real
  const achado = limpo.match(/\d+(?:[.,]\d+)?/);
  if (!achado) return { valor: null, invalida: true };

  const valor = Number(achado[0].replace(",", "."));

  if (!Number.isFinite(valor) || valor <= 0 || valor > CARGA_MAXIMA) {
    return { valor: null, invalida: true };
  }

  return { valor, invalida: false };
}
