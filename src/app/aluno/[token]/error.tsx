"use client";

import { Marca } from "@/componentes/Marca";

/**
 * Sinal ruim na academia.
 *
 * Sem este arquivo, a acao que nao chegava ao servidor derrubava a tela inteira
 * no "Application error" do Next, e o aluno perdia o treino de vista no meio da
 * serie. O `retry` busca a pagina de novo sem recarregar tudo.
 */
export default function Erro({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md flex-1">
      <header className="border-b border-borda px-5 py-4">
        <Marca compacta />
      </header>
      <div className="space-y-3 px-5 py-16 text-center">
        <p className="titulo-marca text-2xl">Sem conexão agora</p>
        <p className="text-sm leading-relaxed text-fumaca">
          O último toque pode não ter salvado. Confira a internet e tente de
          novo.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 h-14 w-full rounded-lg bg-sangue text-base font-semibold uppercase tracking-wider text-white hover:bg-sangue-escuro"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
