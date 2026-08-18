import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BALDE } from "@/lib/copiaDeSeguranca";

/**
 * Entrega uma copia de seguranca para a Kelly baixar.
 *
 * Mesmo desenho do comprovante: a sessao dela responde so "voce esta logada?", e
 * quem busca o arquivo e o servidor. O balde e privado porque ali dentro vai a
 * carteira inteira de alunos, com telefone, peso e avaliacao fisica — nunca
 * pode ser alcancavel pela chave que roda no navegador.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ arquivo: string }> },
) {
  const { arquivo } = await params;

  const sessao = await createClient();
  const {
    data: { user },
  } = await sessao.auth.getUser();
  if (!user) {
    return Response.redirect(new URL("/entrar", request.url));
  }

  // so nomes que este sistema gera; sem isso, um nome com ".." poderia pedir
  // arquivo de outro lugar do deposito
  if (!/^copia-\d{4}-\d{2}-\d{2}\.json$/.test(arquivo)) {
    return new Response("Arquivo inválido.", { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .storage.from(BALDE)
    .createSignedUrl(arquivo, 60 * 10, { download: true });

  if (error || !data?.signedUrl) {
    console.error(`[kelly-treinos] copia ${arquivo}: ${error?.message}`);
    return new Response("Não consegui abrir essa cópia.", { status: 500 });
  }

  return Response.redirect(data.signedUrl);
}
