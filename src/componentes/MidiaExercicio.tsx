import { lerMidia } from "@/lib/midia";
import { PlayerYoutube } from "./PlayerYoutube";

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
      <PlayerYoutube
        embedUrl={midia.embedUrl}
        capaUrl={midia.capaUrl}
        titulo={titulo}
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
