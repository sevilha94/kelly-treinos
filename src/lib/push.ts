import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Aviso = { titulo: string; corpo: string; url: string };

type Assinatura = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configurar() {
  webpush.setVapidDetails(
    "mailto:kellyjhuly1991@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

/**
 * Envia um aviso para varios aparelhos e desativa os que morreram.
 *
 * O servico de push responde 404 ou 410 quando o aparelho desinstalou o app ou
 * revogou a permissao. Sem desativar, o sistema tentaria aquele endereco todo
 * dia, para sempre.
 */
export async function enviarAviso(
  supabase: SupabaseClient,
  tabela: "aluno_lembrete" | "painel_lembrete",
  assinaturas: Assinatura[],
  aviso: Aviso,
): Promise<number> {
  if (assinaturas.length === 0) return 0;

  configurar();
  let enviados = 0;
  const mortas: string[] = [];

  for (const assinatura of assinaturas) {
    try {
      await webpush.sendNotification(
        {
          endpoint: assinatura.endpoint,
          keys: { p256dh: assinatura.p256dh, auth: assinatura.auth },
        },
        JSON.stringify(aviso),
      );
      enviados++;
    } catch (erro) {
      const status = (erro as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) mortas.push(assinatura.endpoint);
    }
  }

  if (mortas.length > 0) {
    await supabase
      .from(tabela)
      .update({ desativado_em: new Date().toISOString() })
      .in("endpoint", mortas);
  }

  return enviados;
}

/** Avisa quem estiver com o painel instalado no celular. */
export async function avisarPainel(supabase: SupabaseClient, aviso: Aviso) {
  const { data } = await supabase
    .from("painel_lembrete")
    .select("endpoint, p256dh, auth")
    .is("desativado_em", null);

  return enviarAviso(supabase, "painel_lembrete", data ?? [], aviso);
}
