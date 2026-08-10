"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Guarda a assinatura de push do aparelho da Kelly.
 *
 * Amarrada ao usuario que fez login, e nao a um aluno: quem recebe estes avisos
 * e quem opera o painel.
 */
export async function salvarAssinaturaPainel(dados: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("painel_lembrete").upsert(
    {
      usuario_id: user.id,
      endpoint: dados.endpoint,
      p256dh: dados.p256dh,
      auth: dados.auth,
      desativado_em: null,
    },
    { onConflict: "endpoint" },
  );
}

export async function removerAssinaturaPainel(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("painel_lembrete")
    .delete()
    .eq("usuario_id", user.id)
    .eq("endpoint", endpoint);
}
