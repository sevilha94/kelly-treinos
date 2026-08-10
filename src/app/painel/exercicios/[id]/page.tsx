import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
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

      {/* estava como texto miudo no rodape e com o nome "Remover da
          biblioteca": quem procurava excluir nao achava. Botao de verdade, com
          a palavra que a pessoa procura */}
      <form action={arquivarExercicio} className="border-t border-borda pt-5">
        <input type="hidden" name="id" value={id} />
        <BotaoAcao
          variante="secundario"
          carregando="Excluindo..."
          confirmar={`Excluir "${data.nome}" da biblioteca?`}
          className="h-11 w-full border-sangue-escuro text-sangue-claro hover:border-sangue"
        >
          Excluir exercício
        </BotaoAcao>
        <p className="mt-1.5 text-xs text-fumaca">
          Ele sai da biblioteca e da lista de montar planilha. As planilhas que
          já usam continuam funcionando, e dá para trazer de volta lá embaixo na
          biblioteca.
        </p>
      </form>
    </div>
  );
}
