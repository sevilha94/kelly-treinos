"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Variante = "principal" | "secundario" | "perigo" | "texto";

const ESTILO: Record<Variante, string> = {
  principal:
    "h-9 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro",
  secundario:
    "h-9 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-gelo hover:border-fumaca",
  perigo:
    "h-9 rounded-lg px-3 text-xs uppercase tracking-wider text-fumaca hover:text-sangue-claro",
  texto: "text-sm text-fumaca hover:text-sangue-claro",
};

/**
 * Botao de acao que sempre diz o que esta acontecendo.
 *
 * Duas coisas que faltavam e apareciam como "nao funcionou": nada mudava na
 * tela enquanto a acao rodava, e nada impedia o segundo toque — que em varios
 * casos desfazia o primeiro.
 *
 * `confirmar` existe so para o que nao tem volta. Perguntar em tudo ensina a
 * pessoa a clicar em "ok" sem ler, e ai a pergunta perde a serventia.
 */
export function BotaoAcao({
  children,
  carregando,
  variante = "principal",
  confirmar,
  className = "",
  ...props
}: {
  children: ReactNode;
  carregando?: string;
  variante?: Variante;
  confirmar?: string;
  className?: string;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(evento) => {
        if (confirmar && !window.confirm(confirmar)) evento.preventDefault();
      }}
      className={`inline-flex items-center justify-center transition-opacity disabled:opacity-60 ${ESTILO[variante]} ${className}`}
    >
      {pending && carregando ? carregando : children}
    </button>
  );
}
