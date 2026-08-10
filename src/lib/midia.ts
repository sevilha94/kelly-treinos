/**
 * A Kelly cola um link qualquer no cadastro do exercicio e o app descobre o que
 * fazer com ele. Assim da pra comecar a biblioteca so com GIF e ir trocando por
 * video dela aos poucos, sem mexer em nada aqui.
 */
export type Midia =
  | { tipo: "youtube"; embedUrl: string; capaUrl: string }
  | { tipo: "video"; url: string }
  | { tipo: "imagem"; url: string }
  | { tipo: "vazio" };

const EXTENSOES_VIDEO = [".mp4", ".webm", ".mov", ".ogv"];

/** Onde moram os videos que a propria Kelly gravou e enviou. */
export const PASTA_DOS_VIDEOS = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/`;

/**
 * Se o link aponta para um video nosso, devolve o nome do arquivo la dentro.
 *
 * Serve para apagar o antigo quando ela troca o video de um exercicio — sem
 * isso cada troca deixaria um arquivo morto ocupando espaco para sempre.
 */
export function arquivoDoVideoEnviado(
  url: string | null | undefined,
): string | null {
  const limpo = url?.trim();
  if (!limpo?.startsWith(PASTA_DOS_VIDEOS)) return null;
  return decodeURIComponent(limpo.slice(PASTA_DOS_VIDEOS.length)) || null;
}

export function lerMidia(url: string | null | undefined): Midia {
  const limpo = url?.trim();
  if (!limpo) return { tipo: "vazio" };

  const id = idDoYoutube(limpo);
  if (id) {
    // loop precisa do playlist apontando pro proprio video.
    //
    // mute=1 porque o aluno esta na academia, muitas vezes de fone ou no meio
    // do barulho: o que importa e o movimento, nao a narracao. Vale tambem para
    // o comeco sozinho funcionar — celular nao deixa video arrancar com som,
    // entao sem isso o toque na capa abre o player e ele fica parado. Quem
    // quiser som liga no proprio player.
    return {
      tipo: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&loop=1&mute=1&playlist=${id}`,
      // capa estatica: pesa alguns KB no lugar de um player inteiro
      capaUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const semQuery = limpo.split("?")[0].toLowerCase();
  if (EXTENSOES_VIDEO.some((ext) => semQuery.endsWith(ext))) {
    return { tipo: "video", url: limpo };
  }

  return { tipo: "imagem", url: limpo };
}

function idDoYoutube(url: string): string | null {
  const padroes = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];

  for (const padrao of padroes) {
    const achou = url.match(padrao);
    if (achou) return achou[1];
  }
  return null;
}
