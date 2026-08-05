import { lerMidia } from "@/lib/midia";

/**
 * Mostra a demonstracao do exercicio, seja ela GIF, imagem, video solto ou
 * YouTube. A Kelly nao precisa saber a diferenca: ela cola o link e pronto.
 */
export function MidiaExercicio({
  url,
  titulo,
}: {
  url: string | null | undefined;
  titulo: string;
}) {
  const midia = lerMidia(url);

  if (midia.tipo === "vazio") {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-borda bg-grafite text-sm text-fumaca">
        Sem demonstração ainda
      </div>
    );
  }

  if (midia.tipo === "youtube") {
    return (
      <iframe
        src={midia.embedUrl}
        title={`Demonstração: ${titulo}`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-xl border border-borda bg-black"
      />
    );
  }

  if (midia.tipo === "video") {
    return (
      <video
        src={midia.url}
        controls
        loop
        muted
        playsInline
        className="aspect-video w-full rounded-xl border border-borda bg-black object-contain"
      />
    );
  }

  return (
    // sao links externos e variados (GIF do Giphy, imagem do Drive, etc.),
    // entao next/image nao ajuda aqui
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={midia.url}
      alt={`Demonstração do exercício ${titulo}`}
      loading="lazy"
      className="aspect-video w-full rounded-xl border border-borda bg-black object-contain"
    />
  );
}
