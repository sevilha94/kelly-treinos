"use client";

import { useState } from "react";
import { verComprovante } from "../actions";

/**
 * Abre o comprovante numa aba nova.
 *
 * O endereco e pedido no momento do clique e vale uma hora — nao fica gravado
 * na pagina, entao nao vaza por historico de navegacao nem por link copiado
 * meses depois.
 */
export function VerComprovante({ caminho }: { caminho: string }) {
  const [abrindo, setAbrindo] = useState(false);

  return (
    <button
      type="button"
      disabled={abrindo}
      onClick={async () => {
        setAbrindo(true);
        const url = await verComprovante(caminho);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        setAbrindo(false);
      }}
      className="h-9 shrink-0 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-gelo hover:border-fumaca disabled:opacity-60"
    >
      {abrindo ? "Abrindo..." : "Ver comprovante"}
    </button>
  );
}
