"use client";

import { useState } from "react";

/**
 * A chave para onde o aluno manda o Pix.
 *
 * Copiar com um toque importa mais do que parece: digitar chave errada e o
 * jeito mais comum de o dinheiro ir para a conta de um estranho. O nome do
 * titular fica junto para ele conferir antes de confirmar no banco.
 */
export function ChavePix({
  chave,
  titular,
}: {
  chave: string;
  titular: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="rounded-lg border border-borda bg-preto/40 px-3 py-2.5">
      <span className="block text-[10px] uppercase tracking-widest text-fumaca">
        Chave Pix
      </span>

      <div className="mt-1 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-base tabular-nums">
          {chave}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(chave);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
          className="h-9 shrink-0 rounded-lg bg-sangue px-3 text-xs font-semibold uppercase tracking-wider text-white"
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>

      {titular && (
        <span className="mt-1 block text-xs text-fumaca">
          Confira o nome no banco: {titular}
        </span>
      )}
    </div>
  );
}
