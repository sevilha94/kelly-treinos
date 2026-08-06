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

export function lerMidia(url: string | null | undefined): Midia {
  const limpo = url?.trim();
  if (!limpo) return { tipo: "vazio" };

  const id = idDoYoutube(limpo);
  if (id) {
    // loop precisa do playlist apontando pro proprio video
    return {
      tipo: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}`,
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
