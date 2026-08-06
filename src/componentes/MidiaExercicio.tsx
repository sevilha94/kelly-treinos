import { lerMidia } from "@/lib/midia";

/**
 * Mostra a demonstracao do exercicio, seja ela GIF, imagem, video solto ou
 * YouTube. A Kelly nao precisa saber a diferenca: ela cola o link e pronto.
 *
 * O video do YouTube so carrega quando o aluno pede. Antes, um treino de oito
 * exercicios subia oito players de uma vez no 4G da academia para ele assistir
 * um — o `loading="lazy"` do iframe ajuda pouco, porque a lista e curta e tudo
 * cai dentro da tela.
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
      <details className="group">
        <summary className="relative flex aspect-video w-full cursor-pointer list-none items-center justify-center overflow-hidden rounded-xl border border-borda bg-black group-open:hidden">
          {/* a capa vem do proprio YouTube: uma imagem no lugar de um player */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={midia.capaUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sangue text-xl text-white">
            ▶
          </span>
          <span className="sr-only">Ver como executar {titulo}</span>
        </summary>

        <iframe
          src={`${midia.embedUrl}&autoplay=1`}
          title={`Demonstração: ${titulo}`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border border-borda bg-black"
        />
      </details>
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
        preload="none"
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
