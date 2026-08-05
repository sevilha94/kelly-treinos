import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave secreta: ignora RLS.
 *
 * Usado nas paginas do aluno, que nao tem login: o servidor confere o token da
 * URL primeiro e so entao busca os dados daquele aluno. Nunca pode ser importado
 * em codigo que roda no navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
