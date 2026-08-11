"use client";

import { useRef, useState } from "react";
import { pedirEnvioDeVideo } from "./actions";

const LIMITE_MB = 50;

/** Quando o celular nao diz o tipo do arquivo, deduzimos pela extensao. */
const TIPO_POR_EXTENSAO: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/**
 * Envia um video gravado pela Kelly direto para o deposito.
 *
 * O arquivo nao passa pelo servidor do site: ele pede um cracha temporario e
 * sobe sozinho. Por isso da para mostrar o quanto ja foi — num video de 40 MB
 * no 4G da academia, uma tela parada por dois minutos parece travada, e ela
 * fecharia no meio.
 */
export function EnvioDeVideo({
  aoEnviar,
}: {
  aoEnviar: (endereco: string) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState("");
  const emCurso = useRef<XMLHttpRequest | null>(null);

  async function escolheu(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // limpa o campo para ela poder escolher o mesmo arquivo de novo se algo der errado
    evento.target.value = "";
    if (!arquivo) return;

    setErro("");

    const mb = arquivo.size / 1024 / 1024;
    if (mb > LIMITE_MB) {
      setErro(
        `Esse vídeo tem ${Math.round(mb)} MB e o limite é ${LIMITE_MB} MB. ` +
          `Grave um trecho mais curto, de 10 a 15 segundos — é o bastante para mostrar o movimento.`,
      );
      return;
    }

    setEnviando(true);
    setProgresso(0);

    const porta = await pedirEnvioDeVideo(arquivo.name);
    if ("erro" in porta) {
      setErro(porta.erro);
      setEnviando(false);
      return;
    }

    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    const tipo = arquivo.type || TIPO_POR_EXTENSAO[extensao] || "video/mp4";

    const corpo = new FormData();
    corpo.append("cacheControl", "3600");
    // o campo vai sem nome mesmo: e assim que o deposito espera receber
    corpo.append("", arquivo.slice(0, arquivo.size, tipo), arquivo.name);

    const pedido = new XMLHttpRequest();
    emCurso.current = pedido;
    pedido.open("PUT", porta.enderecoDeEnvio);

    pedido.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        setProgresso(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    const encerrar = () => {
      setEnviando(false);
      emCurso.current = null;
    };

    pedido.onload = () => {
      encerrar();
      if (pedido.status >= 200 && pedido.status < 300) {
        aoEnviar(porta.enderecoFinal);
      } else {
        setErro("O envio não completou. Tente de novo, de preferência no Wi-Fi.");
      }
    };
    pedido.onerror = () => {
      encerrar();
      setErro("A internet caiu no meio do envio. Tente de novo.");
    };
    pedido.onabort = encerrar;

    pedido.send(corpo);
  }

  if (enviando) {
    return (
      <div className="space-y-2 rounded-lg border border-borda bg-grafite px-3 py-3">
        <p className="text-sm">Enviando seu vídeo — {progresso}%</p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-carvao"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-sangue transition-[width] duration-200"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-xs text-fumaca">
          Não feche esta tela até terminar.
        </p>
        <button
          type="button"
          onClick={() => emCurso.current?.abort()}
          className="inline-flex min-h-11 items-center text-xs uppercase tracking-wider text-fumaca underline"
        >
          Cancelar envio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-borda px-4 text-xs font-semibold uppercase tracking-wider text-gelo hover:border-fumaca">
        Enviar um vídeo do celular
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={escolheu}
          className="sr-only"
        />
      </label>
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <p className="text-xs text-fumaca">
        Grave de 10 a 15 segundos, na horizontal, mostrando o movimento inteiro.
        Até {LIMITE_MB} MB.
      </p>
    </div>
  );
}
