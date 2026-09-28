import type { User } from "@supabase/supabase-js";

/**
 * Estar logado nao basta: tem que ser a conta da Kelly.
 *
 * O Supabase deixa qualquer um criar conta se o "Allow new users to sign up"
 * estiver ligado (vem ligado de fabrica), e o painel inteiro tratava qualquer
 * usuario como ela, inclusive para trocar a chave Pix que o aluno ve.
 * Sem KELLY_USER_ID ninguem entra: falha fechada.
 */
export function ehAKelly(user: User | null): user is User {
  return Boolean(user && process.env.KELLY_USER_ID && user.id === process.env.KELLY_USER_ID);
}
