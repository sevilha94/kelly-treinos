"use client";

import { useFormStatus } from "react-dom";

/**
 * Botao de salvar que avisa que esta salvando.
 *
 * O sistema grava a cada clique, sem rascunho — mas sem retorno na tela a
 * pessoa acha que nao salvou e clica de novo. O estado de "Salvando..." vem do
 * proprio formulario, entao nao precisamos controlar nada a mao.
 */
export function BotaoSalvar({
  children = "Salvar",
  salvando = "Salvando...",
  variante = "principal",
  className = "",
}: {
  children?: string;
  salvando?: string;
  variante?: "principal" | "secundario";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const estilo =
    variante === "principal"
      ? "bg-sangue text-white hover:bg-sangue-claro"
      : "border border-borda text-gelo hover:border-fumaca";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className={`h-9 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider transition-opacity disabled:opacity-60 ${estilo} ${className}`}
    >
      {pending ? salvando : children}
    </button>
  );
}
