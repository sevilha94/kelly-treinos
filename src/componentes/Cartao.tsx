import type { ReactNode } from "react";

export function Cartao({
  titulo,
  acao,
  children,
}: {
  titulo?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-borda bg-carvao">
      {titulo && (
        <header className="faixa flex items-center justify-between gap-3 px-4 py-2.5">
          <h2 className="titulo-marca text-lg text-white">{titulo}</h2>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-fumaca">{children}</p>
  );
}
