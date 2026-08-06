"use client";

import { useState } from "react";

/**
 * Capa estatica no lugar do player, ate o aluno pedir.
 *
 * Esconder o iframe com CSS nao resolve: medindo na pagina publicada, o
 * navegador pedia os tres players mesmo dentro de um bloco fechado. A unica
 * forma de nao baixar e nao existir no documento — por isso a troca acontece
 * no clique, e nao no estilo.
 */
export function PlayerYoutube({
  embedUrl,
  capaUrl,
  titulo,
}: {
  embedUrl: string;
  capaUrl: string;
  titulo: string;
}) {
  const [tocando, setTocando] = useState(false);

  if (tocando) {
    return (
      <iframe
        src={`${embedUrl}&autoplay=1`}
        title={`Demonstração: ${titulo}`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-xl border border-borda bg-black"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTocando(true)}
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-borda bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={capaUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-75"
      />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sangue text-xl text-white">
        ▶
      </span>
      <span className="sr-only">Ver como executar {titulo}</span>
    </button>
  );
}
