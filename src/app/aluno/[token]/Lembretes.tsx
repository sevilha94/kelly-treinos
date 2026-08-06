"use client";

import { useState } from "react";
import { salvarAssinatura, removerAssinatura } from "./actions";

type Estado =
  | "pronto"
  | "pedindo"
  | "ligado"
  | "desligando"
  | "negado"
  | "sem-suporte";

/**
 * Liga o lembrete no celular do aluno.
 *
 * O navegador so aceita pedir permissao a partir de um toque dele — por isso
 * botao, e nao um pedido automatico ao abrir a pagina. Pedir sem contexto e a
 * forma mais rapida de a pessoa negar para sempre.
 */
export function Lembretes({
  token,
  jaLigado,
}: {
  token: string;
  jaLigado: boolean;
}) {
  const [estado, setEstado] = useState<Estado>(jaLigado ? "ligado" : "pronto");
  const [erro, setErro] = useState<string | null>(null);

  async function ligar() {
    setErro(null);
    setEstado("pedindo");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("sem-suporte");
        return;
      }

      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado("negado");
        return;
      }

      const registro = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const assinatura = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      });

      const dados = assinatura.toJSON();
      await salvarAssinatura({
        token,
        endpoint: dados.endpoint!,
        p256dh: dados.keys!.p256dh,
        auth: dados.keys!.auth,
      });

      setEstado("ligado");
    } catch {
      setErro("Não consegui ligar o lembrete. Tente de novo mais tarde.");
      setEstado("pronto");
    }
  }

  async function desligar() {
    setEstado("desligando");
    const registro = await navigator.serviceWorker.getRegistration();
    const assinatura = await registro?.pushManager.getSubscription();

    if (assinatura) {
      await removerAssinatura({ token, endpoint: assinatura.endpoint });
      await assinatura.unsubscribe();
    }
    setEstado("pronto");
  }

  return (
    <div className="border-b border-borda px-5 py-4">
      {estado === "ligado" || estado === "desligando" ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-fumaca">
            Lembrete ligado neste aparelho.
          </span>
          <button
            onClick={desligar}
            disabled={estado === "desligando"}
            className="shrink-0 text-xs uppercase tracking-wider text-fumaca underline disabled:opacity-60"
          >
            {estado === "desligando" ? "Desligando..." : "Desligar"}
          </button>
        </div>
      ) : estado === "negado" ? (
        <p className="text-sm text-fumaca">
          As notificações estão bloqueadas para este site. Para ligar, libere
          nas configurações do navegador e toque de novo.
        </p>
      ) : estado === "sem-suporte" ? (
        <p className="text-sm text-fumaca">
          Este navegador não aceita lembretes. No iPhone, adicione o treino à
          tela de início e abra por lá.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm text-fumaca">
            Quer um lembrete no dia do seu treino?
          </span>
          <button
            onClick={ligar}
            disabled={estado === "pedindo"}
            className="h-9 shrink-0 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-60"
          >
            {estado === "pedindo" ? "Ligando..." : "Quero"}
          </button>
        </div>
      )}

      {erro && <p className="mt-2 text-sm text-sangue-claro">{erro}</p>}
    </div>
  );
}
