"use client";

import { useState } from "react";

export function LinkDoAluno({ url, nome }: { url: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);

  const mensagem = `Oi ${nome}! Esse é o link do seu treino, com o vídeo de cada exercício. Salva nos favoritos do celular: ${url}`;

  return (
    <div className="space-y-3 px-4 py-4">
      <p className="break-all rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-fumaca">
        {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
          className="h-10 rounded-lg border border-borda px-4 text-xs font-semibold uppercase tracking-wider text-gelo hover:border-fumaca"
        >
          {copiado ? "Copiado!" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro"
        >
          Enviar no WhatsApp
        </a>
      </div>
      <p className="text-xs text-fumaca">
        Só quem tem este link consegue abrir a planilha. Ele nunca muda: se você
        editar o treino, o aluno já vê a versão nova.
      </p>
    </div>
  );
}
