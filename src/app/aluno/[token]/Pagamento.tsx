"use client";

import { useActionState } from "react";
import { enviarComprovante, type EstadoComprovante } from "./actions";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { formataData } from "@/lib/tipos";
import { nivelDaMensalidade, type Mensalidade } from "@/lib/mensalidades";
import { ChavePix } from "./ChavePix";

/**
 * Onde o aluno avisa que pagou.
 *
 * So aparece quando existe mensalidade em aberto — quem esta em dia nao precisa
 * ver cobranca toda vez que abre o treino.
 */
export function Pagamento({
  token,
  emAberto,
  chavePix,
  titularPix,
}: {
  token: string;
  emAberto: Mensalidade;
  chavePix: string;
  titularPix: string;
}) {
  const [estado, acao] = useActionState<EstadoComprovante, FormData>(
    enviarComprovante,
    {},
  );

  const { nivel, diasDeAtraso } = nivelDaMensalidade(emAberto);
  const jaEnviou = Boolean(emAberto.enviado_em) || estado.enviado;

  if (jaEnviou) {
    return (
      // quem fala aqui e a Kelly, entao o texto vai no feminino. E so a
      // confirmacao: contar que ela ainda vai conferir e processo interno, nao
      // assunto do aluno
      <div className="mx-5 mt-4 rounded-lg border border-borda bg-grafite px-3 py-2.5">
        <p className="text-sm">Comprovante recebido, obrigada!</p>
      </div>
    );
  }

  return (
    <form
      action={acao}
      className={`mx-5 mt-4 space-y-2.5 rounded-lg border px-3 py-3 ${
        nivel === "em_dia"
          ? "border-borda bg-grafite"
          : "border-sangue-escuro bg-sangue-escuro/10"
      }`}
    >
      <input type="hidden" name="token" value={token} />

      <div>
        <p className="text-sm">
          Mensalidade de R${" "}
          {Number(emAberto.valor).toFixed(2).replace(".", ",")} · vence{" "}
          {formataData(emAberto.vencimento)}
        </p>
        {diasDeAtraso > 0 && (
          <p className="mt-0.5 text-xs text-alerta">
            {diasDeAtraso === 1 ? "1 dia" : `${diasDeAtraso} dias`} em atraso.
            Envie o comprovante para continuar treinando.
          </p>
        )}
      </div>

      {chavePix && <ChavePix chave={chavePix} titular={titularPix} />}

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-fumaca">
          Comprovante do Pix
        </span>
        <input
          type="file"
          name="comprovante"
          accept="image/*,application/pdf"
          required
          // acima de 4 MB a Vercel recusa o envio antes do servidor responder,
          // e o aluno veria uma tela de erro generica
          onChange={(evento) => {
            const campo = evento.currentTarget;
            campo.setCustomValidity(
              (campo.files?.[0]?.size ?? 0) > 4 * 1024 * 1024
                ? "Arquivo muito grande (máximo 4 MB). Mande um print da tela."
                : "",
            );
          }}
          className="w-full min-h-11 text-sm text-fumaca file:mr-3 file:h-11 file:rounded-lg file:border-0 file:bg-grafite file:px-4 file:text-xs file:uppercase file:tracking-wider file:text-gelo"
        />
      </label>

      {estado.erro && <p className="text-sm text-alerta">{estado.erro}</p>}

      <BotaoAcao carregando="Enviando..." className="h-10 w-full">
        Já paguei — enviar comprovante
      </BotaoAcao>

      <p className="text-xs text-fumaca">
        Pode ser o print do aplicativo do banco. Só a Kelly vê.
      </p>
    </form>
  );
}
