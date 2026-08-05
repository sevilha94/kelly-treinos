import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const COOKIE_DISPOSITIVO = "kj_dispositivo";

/**
 * Anota que este aparelho abriu o link do aluno.
 *
 * Nao guardamos IP nem nada que identifique a pessoa: so o id aleatorio que o
 * proxy gravou no navegador e um rotulo grosseiro do aparelho. Serve apenas
 * para a Kelly desconfiar de um link muito compartilhado — trocar de celular
 * ou limpar o navegador tambem cria um "aparelho novo", entao nunca e prova.
 */
export async function registrarAcesso(alunoId: string) {
  const dispositivoId = (await cookies()).get(COOKIE_DISPOSITIVO)?.value;
  if (!dispositivoId) return;

  const supabase = createAdminClient();
  const agora = new Date().toISOString();

  const { data: existente } = await supabase
    .from("aluno_acesso")
    .select("visitas")
    .eq("aluno_id", alunoId)
    .eq("dispositivo_id", dispositivoId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("aluno_acesso")
      .update({ ultimo_em: agora, visitas: existente.visitas + 1 })
      .eq("aluno_id", alunoId)
      .eq("dispositivo_id", dispositivoId);
    return;
  }

  await supabase.from("aluno_acesso").insert({
    aluno_id: alunoId,
    dispositivo_id: dispositivoId,
    aparelho: await rotuloDoAparelho(),
  });
}

async function rotuloDoAparelho() {
  const ua = (await headers()).get("user-agent") ?? "";

  const sistema = /iPhone|iPad/i.test(ua)
    ? "iPhone"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X/i.test(ua)
          ? "Mac"
          : "Outro";

  const navegador = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "";

  return navegador ? `${sistema} · ${navegador}` : sistema;
}
