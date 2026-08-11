"use client";

import { useState } from "react";
import {
  salvarAssinaturaPainel,
  removerAssinaturaPainel,
} from "./avisos-actions";

type Estado = "pronto" | "pedindo" | "ligado" | "negado" | "sem-suporte";

/**
 * Liga os avisos no celular da Kelly.
 *
 * Mesma tecnologia dos lembretes do aluno. Sem isso ela so descobre um
 * comprovante quando abre o painel — e comprovante que chega sexta a noite
 * ficaria ate segunda sem ela saber.
 */
export function AvisosNoCelular({ jaLigado }: { jaLigado: boolean }) {
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
      await salvarAssinaturaPainel({
        endpoint: dados.endpoint!,
        p256dh: dados.keys!.p256dh,
        auth: dados.keys!.auth,
      });

      setEstado("ligado");
    } catch {
      setErro("Não consegui ligar os avisos. Tente de novo mais tarde.");
      setEstado("pronto");
    }
  }

  async function desligar() {
    const registro = await navigator.serviceWorker.getRegistration();
    const assinatura = await registro?.pushManager.getSubscription();

    if (assinatura) {
      await removerAssinaturaPainel(assinatura.endpoint);
      await assinatura.unsubscribe();
    }
    setEstado("pronto");
  }

  return (
    <details className="rounded-2xl border border-borda bg-carvao">
      <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
        Avisos no seu celular
        {estado === "ligado" && (
          <span className="ml-2 text-xs normal-case text-fumaca">ligados</span>
        )}
      </summary>

      <div className="space-y-3 px-4 pb-4">
        <p className="text-sm leading-relaxed text-fumaca">
          Você recebe no celular quando um aluno enviar comprovante de
          pagamento, sem precisar abrir o painel para descobrir.
        </p>

        {estado === "ligado" ? (
          <button
            onClick={desligar}
            className="h-11 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-gelo hover:border-fumaca"
          >
            Desligar avisos
          </button>
        ) : estado === "negado" ? (
          <p className="text-sm text-alerta">
            As notificações estão bloqueadas para este site. Libere nas
            configurações do navegador e toque de novo.
          </p>
        ) : estado === "sem-suporte" ? (
          <p className="text-sm text-alerta">
            Este navegador não aceita avisos. No iPhone, adicione o painel à
            tela de início e abra por lá.
          </p>
        ) : (
          <button
            onClick={ligar}
            disabled={estado === "pedindo"}
            className="h-11 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-60"
          >
            {estado === "pedindo" ? "Ligando..." : "Ligar avisos"}
          </button>
        )}

        {erro && <p className="text-sm text-alerta">{erro}</p>}

        <p className="text-xs text-fumaca">
          Vale por aparelho. Se você usa celular e computador, ligue nos dois.
        </p>
      </div>
    </details>
  );
}
