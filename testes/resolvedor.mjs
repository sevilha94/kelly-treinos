/**
 * Deixa o testador do Node entender os imports do projeto.
 *
 * O codigo usa "./tipos" sem extensao, como o Next resolve. O Node exige
 * "./tipos.ts". Em vez de mudar o projeto inteiro para agradar o testador —
 * o que faria o teste ditar o formato do codigo de producao — o ajuste fica
 * aqui, em oito linhas.
 */
export async function resolve(especificador, contexto, proximo) {
  try {
    return await proximo(especificador, contexto);
  } catch (erro) {
    if (especificador.startsWith(".")) {
      for (const sufixo of [".ts", "/index.ts"]) {
        try {
          return await proximo(especificador + sufixo, contexto);
        } catch {}
      }
    }
    throw erro;
  }
}
