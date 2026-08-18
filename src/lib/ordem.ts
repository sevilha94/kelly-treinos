/**
 * Ordem dos exercicios dentro de um treino.
 *
 * Vive separado da acao de servidor por um motivo pratico: foi aqui que nasceu
 * um defeito que ficou meses de pe — dois exercicios com a mesma posicao
 * travavam o subir/descer, e o botao nao fazia nada nem avisava. Regra que ja
 * quebrou uma vez precisa poder ser testada sem banco e sem navegador.
 */

export type ItemOrdenavel = { id: string; ordem: number };
export type Direcao = "cima" | "baixo";

/**
 * Devolve a lista inteira renumerada de 0 em diante, com o item movido uma
 * casa. Devolve `null` quando o movimento nao existe — primeiro subindo ou
 * ultimo descendo.
 *
 * Renumerar tudo, em vez de trocar o numero com o vizinho, e o que torna o
 * resultado imune a empate e a buraco na numeracao: qualquer bagunca herdada se
 * conserta sozinha no primeiro movimento.
 */
export function reordenar(
  lista: ItemOrdenavel[],
  itemId: string,
  direcao: Direcao,
): ItemOrdenavel[] | null {
  // desempate pelo id para o resultado nao depender da ordem em que o banco
  // devolveu duas linhas empatadas
  const atual = [...lista].sort(
    (a, b) => a.ordem - b.ordem || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  const de = atual.findIndex((item) => item.id === itemId);
  if (de < 0) return null;

  const para = direcao === "cima" ? de - 1 : de + 1;
  if (para < 0 || para >= atual.length) return null;

  const [movido] = atual.splice(de, 1);
  atual.splice(para, 0, movido);

  return atual.map((item, posicao) => ({ id: item.id, ordem: posicao }));
}

/** Só o que mudou de posição — evita escrita à toa no banco. */
export function posicoesQueMudaram(
  antes: ItemOrdenavel[],
  depois: ItemOrdenavel[],
): ItemOrdenavel[] {
  const anterior = new Map(antes.map((item) => [item.id, item.ordem]));
  return depois.filter((item) => anterior.get(item.id) !== item.ordem);
}
