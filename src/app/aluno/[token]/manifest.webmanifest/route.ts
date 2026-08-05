/**
 * Manifesto por aluno.
 *
 * O manifesto e o que faz o celular tratar a pagina como aplicativo ao inves de
 * como site. Ele precisa ser individual porque o `start_url` decide o que abre
 * quando o aluno toca no icone — com um manifesto unico na raiz, todo mundo
 * cairia na tela de login da Kelly.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  return Response.json(
    {
      name: "Kelly Jhuly — Meu treino",
      short_name: "Meu treino",
      description: "Sua planilha de treino, com vídeo de cada exercício.",
      start_url: `/aluno/${token}`,
      scope: `/aluno/${token}`,
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b0b0c",
      theme_color: "#0b0b0c",
      lang: "pt-BR",
      icons: [
        {
          src: "/icone-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icone-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        // o token esta na URL: nao pode ficar em cache compartilhado
        "Cache-Control": "private, max-age=3600",
      },
    },
  );
}
