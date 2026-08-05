import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("aluno")
    .select("id, nome, objetivo")
    .is("arquivado_em", null)
    .order("nome");

  const alunos = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="titulo-marca text-3xl">Alunos</h1>
        <Link
          href="/painel/alunos/novo"
          className="inline-flex h-11 items-center rounded-lg bg-sangue px-4 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro"
        >
          Novo aluno
        </Link>
      </div>

      <Cartao>
        {alunos.length === 0 ? (
          <Vazio>Nenhum aluno cadastrado ainda.</Vazio>
        ) : (
          <ul className="divide-y divide-borda">
            {alunos.map((aluno) => (
              <li key={aluno.id}>
                <Link
                  href={`/painel/alunos/${aluno.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-grafite"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base">{aluno.nome}</span>
                    {aluno.objetivo && (
                      <span className="block truncate text-xs text-fumaca">
                        {aluno.objetivo}
                      </span>
                    )}
                  </span>
                  <span aria-hidden className="text-fumaca">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
