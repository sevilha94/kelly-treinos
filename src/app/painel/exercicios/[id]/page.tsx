import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioExercicio } from "../FormularioExercicio";
import { arquivarExercicio } from "../actions";
import type { Exercicio } from "@/lib/tipos";

export default async function Page(
  props: PageProps<"/painel/exercicios/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular, midia_url, dica")
    .eq("id", id)
    .is("arquivado_em", null)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/painel/exercicios" className="text-sm text-fumaca hover:text-gelo">
        ‹ Voltar para a biblioteca
      </Link>
      <h1 className="titulo-marca text-3xl">Editar exercício</h1>

      <FormularioExercicio exercicio={data as Exercicio} />

      <form action={arquivarExercicio} className="border-t border-borda pt-5">
        <input type="hidden" name="id" value={id} />
        <button className="text-sm text-fumaca hover:text-sangue-claro">
          Remover da biblioteca
        </button>
        <p className="mt-1 text-xs text-fumaca">
          As planilhas que já usam este exercício continuam funcionando.
        </p>
      </form>
    </div>
  );
}
