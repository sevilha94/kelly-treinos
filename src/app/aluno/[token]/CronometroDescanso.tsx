"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cronometro de descanso entre series.
 *
 * Conta a partir do relogio, nao somando segundos: no celular o navegador
 * congela temporizadores quando a tela apaga, e o aluno guarda o telefone no
 * bolso durante o descanso — justamente a hora em que ele precisa da contagem
 * certa. Guardando o horario do fim, voltar para a tela mostra o tempo real.
 */
export function CronometroDescanso({ segundos }: { segundos: number }) {
  const [terminaEm, setTerminaEm] = useState<number | null>(null);
  const [restante, setRestante] = useState(segundos);
  const jaAvisou = useRef(false);

  useEffect(() => {
    if (terminaEm === null) return;

    const tique = () => {
      const falta = Math.max(0, Math.ceil((terminaEm - Date.now()) / 1000));
      setRestante(falta);

      if (falta === 0 && !jaAvisou.current) {
        jaAvisou.current = true;
        // vibrar funciona no Android; no iPhone e ignorado sem erro
        navigator.vibrate?.([200, 100, 200]);
      }
    };

    tique();
    const id = setInterval(tique, 250);
    return () => clearInterval(id);
  }, [terminaEm]);

  const rodando = terminaEm !== null && restante > 0;
  const acabou = terminaEm !== null && restante === 0;

  function comecar() {
    jaAvisou.current = false;
    setRestante(segundos);
    setTerminaEm(Date.now() + segundos * 1000);
  }

  function parar() {
    setTerminaEm(null);
    setRestante(segundos);
    jaAvisou.current = false;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
        acabou ? "border-sangue bg-sangue-escuro/20" : "border-borda bg-grafite"
      }`}
    >
      <span className="text-[10px] uppercase tracking-widest text-fumaca">
        Descanso
      </span>

      <span
        aria-live={acabou ? "assertive" : "off"}
        className={`flex-1 text-lg tabular-nums ${acabou ? "text-sangue-claro" : ""}`}
      >
        {acabou ? "Pode ir!" : formataTempo(rodando ? restante : segundos)}
      </span>

      <button
        type="button"
        onClick={rodando ? parar : comecar}
        className={`h-9 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider ${
          rodando
            ? "border border-borda text-fumaca"
            : "bg-sangue text-white"
        }`}
      >
        {rodando ? "Parar" : acabou ? "De novo" : "Iniciar"}
      </button>
    </div>
  );
}

function formataTempo(total: number) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return minutos > 0
    ? `${minutos}:${String(segundos).padStart(2, "0")}`
    : `${segundos}s`;
}
