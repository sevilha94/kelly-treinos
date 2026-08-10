import { createClient } from "@/lib/supabase/server";

/**
 * Leva a Kelly ao comprovante daquela mensalidade.
 *
 * Existe como endereco proprio, e nao como botao que busca o link e abre a
 * aba, porque o navegador so deixa abrir aba nova no instante do clique —
 * qualquer ida ao servidor no meio transforma aquilo em pop-up e ele bloqueia
 * sem avisar. Sendo um link de verdade, o clique abre direto.
 *
 * O endereco assinado nunca chega ao HTML da pagina: e gerado aqui, usado no
 * redirecionamento e expira em uma hora.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.redirect(new URL("/entrar", request.url));
  }

  const { data: mensalidade } = await supabase
    .from("mensalidade")
    .select("comprovante_caminho")
    .eq("id", id)
    .maybeSingle();

  if (!mensalidade?.comprovante_caminho) {
    return new Response("Comprovante não encontrado.", { status: 404 });
  }

  const { data } = await supabase.storage
    .from("comprovantes")
    .createSignedUrl(mensalidade.comprovante_caminho, 60 * 60);

  if (!data?.signedUrl) {
    return new Response("Não consegui abrir o comprovante.", { status: 500 });
  }

  return Response.redirect(data.signedUrl);
}
