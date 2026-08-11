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
      <Anel fracao={rodando ? restante / segundos : acabou ? 0 : 1} />

      <span className="text-[10px] uppercase tracking-widest text-fumaca">
        Descanso
      </span>

      <span
        aria-live={acabou ? "assertive" : "off"}
        className={`flex-1 text-lg tabular-nums ${acabou ? "text-alerta" : ""}`}
      >
        {acabou ? "Pode ir!" : formataTempo(rodando ? restante : segundos)}
      </span>

      <button
        type="button"
        onClick={rodando ? parar : comecar}
        className={`h-11 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider ${
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

const RAIO = 11;
const VOLTA = 2 * Math.PI * RAIO;

/**
 * Anel que esvazia junto com a contagem.
 *
 * No meio da serie o aluno olha de relance, muitas vezes sem oculos e com o
 * celular no chao: um arco encurtando se le mais rapido do que dois numeros.
 * Nao substitui o tempo escrito, acompanha.
 *
 * Anda pela contagem, e nao por uma animacao propria de CSS, porque o navegador
 * congela animacao com a tela apagada — e o descanso e justamente quando o
 * telefone vai para o bolso. Assim ele volta mostrando a verdade.
 */
function Anel({ fracao }: { fracao: number }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className="h-7 w-7 shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx="14"
        cy="14"
        r={RAIO}
        fill="none"
        strokeWidth="3"
        className="stroke-borda"
      />
      <circle
        cx="14"
        cy="14"
        r={RAIO}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={VOLTA}
        strokeDashoffset={VOLTA * (1 - Math.max(0, Math.min(1, fracao)))}
        className="stroke-sangue transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
      />
    </svg>
  );
}

function formataTempo(total: number) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return minutos > 0
    ? `${minutos}:${String(segundos).padStart(2, "0")}`
    : `${segundos}s`;
}
