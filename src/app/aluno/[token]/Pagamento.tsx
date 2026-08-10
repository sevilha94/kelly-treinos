"use client";

import { useActionState } from "react";
import { enviarComprovante, type EstadoComprovante } from "./actions";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { formataData } from "@/lib/tipos";
import { nivelDaMensalidade, type Mensalidade } from "@/lib/mensalidades";

/**
 * Onde o aluno avisa que pagou.
 *
 * So aparece quando existe mensalidade em aberto — quem esta em dia nao precisa
 * ver cobranca toda vez que abre o treino.
 */
export function Pagamento({
  token,
  emAberto,
}: {
  token: string;
  emAberto: Mensalidade;
}) {
  const [estado, acao] = useActionState<EstadoComprovante, FormData>(
    enviarComprovante,
    {},
  );

  const { nivel, diasDeAtraso } = nivelDaMensalidade(emAberto);
  const jaEnviou = Boolean(emAberto.enviado_em) || estado.enviado;

  if (jaEnviou) {
    return (
      <div className="mx-5 mt-4 rounded-lg border border-borda bg-grafite px-3 py-2.5">
        <p className="text-sm">Comprovante recebido, obrigado!</p>
        <p className="mt-0.5 text-xs text-fumaca">
          A Kelly confere e dá baixa. Seu treino segue liberado normalmente.
        </p>
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
          <p className="mt-0.5 text-xs text-sangue-claro">
            {diasDeAtraso === 1 ? "1 dia" : `${diasDeAtraso} dias`} em atraso.
            Envie o comprovante para continuar treinando.
          </p>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
          Comprovante do Pix
        </span>
        <input
          type="file"
          name="comprovante"
          accept="image/*,application/pdf"
          required
          className="w-full text-sm text-fumaca file:mr-3 file:rounded-lg file:border-0 file:bg-grafite file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-gelo"
        />
      </label>

      {estado.erro && <p className="text-sm text-sangue-claro">{estado.erro}</p>}

      <BotaoAcao carregando="Enviando..." className="h-10 w-full">
        Já paguei — enviar comprovante
      </BotaoAcao>

      <p className="text-xs text-fumaca">
        Pode ser o print do aplicativo do banco. Só a Kelly vê.
      </p>
    </form>
  );
}
