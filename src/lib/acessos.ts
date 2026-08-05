import { createAdminClient } from "@/lib/supabase/admin";

export const COOKIE_DISPOSITIVO = "kj_dispositivo";

/**
 * Anota que este aparelho abriu o link do aluno.
 *
 * Nao guardamos IP nem nada que identifique a pessoa: so o id aleatorio que o
 * proxy gravou no navegador e um rotulo grosseiro do aparelho. Serve apenas
 * para a Kelly desconfiar de um link muito compartilhado — trocar de celular
 * ou limpar o navegador tambem cria um "aparelho novo", entao nunca e prova.
 *
 * Roda depois da resposta ir para o aluno (via `after`), porque e registro:
 * nao pode segurar a pagina para carregar.
 */
export async function registrarAcesso(
  alunoId: string,
  dispositivoId: string | undefined,
  userAgent: string | null,
) {
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
    aparelho: rotuloDoAparelho(userAgent ?? ""),
  });
}

function rotuloDoAparelho(ua: string) {
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
