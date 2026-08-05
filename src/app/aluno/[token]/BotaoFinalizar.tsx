"use client";

import { useFormStatus } from "react-dom";

/**
 * O aluno esta na academia, com sinal ruim. Sem aviso de que o toque foi
 * registrado, ele acha que nao funcionou e toca de novo — e o segundo toque
 * desfazia o primeiro.
 */
export function BotaoFinalizar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="h-12 w-full rounded-xl bg-sangue text-sm font-bold uppercase tracking-widest text-white disabled:opacity-70"
    >
      {pending ? "Finalizando..." : "Finalizar treino de hoje"}
    </button>
  );
}
