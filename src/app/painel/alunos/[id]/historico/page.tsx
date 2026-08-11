import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { historicoDoAluno } from "@/lib/historicoDoAluno";
import { formataCarga, ROTULO_PERCEPCAO } from "@/lib/sessoes";
import { formataData } from "@/lib/tipos";

export default async function Page(
  props: PageProps<"/painel/alunos/[id]/historico">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [alunoRes, historico] = await Promise.all([
    supabase
      .from("aluno")
      .select("id, nome")
      .eq("id", id)
      .is("arquivado_em", null)
      .maybeSingle(),
    historicoDoAluno(supabase, id),
  ]);

  if (!alunoRes.data) notFound();
  const aluno = alunoRes.data;
  const { treinos, evolucao, porSemana } = historico;
  const maiorSemana = Math.max(1, ...porSemana.map((s) => s.treinos));

  return (
    <div className="space-y-5">
      <Link
        href={`/painel/alunos/${id}`}
        className="text-sm text-fumaca hover:text-gelo"
      >
        ‹ Voltar para {aluno.nome}
      </Link>
      <h1 className="titulo-pagina text-3xl">Histórico</h1>

      <Cartao titulo="Treinos por semana">
        <div className="px-4 py-4">
          <div className="flex items-end gap-2">
            {porSemana.map((semana) => (
              <div key={semana.semana} className="flex-1 text-center">
                <span className="mb-1 block text-xs tabular-nums text-fumaca">
                  {semana.treinos}
                </span>
                <span
                  aria-hidden
                  style={{
                    height: `${Math.max(4, (semana.treinos / maiorSemana) * 56)}px`,
                  }}
                  className="block w-full rounded-sm bg-sangue"
                />
                <span className="mt-1 block text-[9px] text-fumaca">
                  {formataData(semana.semana).slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-fumaca">
            Cada barra é uma semana, começando na segunda-feira. Só conta treino
            que ele finalizou pelo link.
          </p>
        </div>
      </Cartao>

      <Cartao titulo="Evolução de carga">
        {evolucao.length === 0 ? (
          <Vazio>
            Nenhuma carga anotada ainda. O aluno precisa preencher o campo de
            carga ao marcar o exercício.
          </Vazio>
        ) : (
          <ul className="divide-y divide-borda">
            {evolucao.map((linha) => {
              const ganho =
                Math.round((linha.ultima.carga - linha.primeira.carga) * 10) /
                10;

              return (
                <li
                  key={linha.nome}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base">
                      {linha.nome}
                    </span>
                    <span className="text-xs text-fumaca">
                      {linha.grupo} · {linha.vezes}{" "}
                      {linha.vezes === 1 ? "registro" : "registros"} desde{" "}
                      {formataData(linha.primeira.data)}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block tabular-nums">
                      {formataCarga(linha.primeira.carga)} →{" "}
                      {formataCarga(linha.ultima.carga)} kg
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        ganho > 0
                          ? "text-sangue-claro"
                          : ganho < 0
                            ? "text-amber-400"
                            : "text-fumaca"
                      }`}
                    >
                      {ganho > 0 && "+"}
                      {ganho === 0 ? "sem mudança" : `${formataCarga(ganho)} kg`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      <Cartao titulo="Como ele avaliou os treinos">
        {treinos.length === 0 ? (
          <Vazio>Nenhum treino finalizado ainda.</Vazio>
        ) : (
          <ul className="divide-y divide-borda">
            {treinos.slice(0, 20).map((treino, indice) => (
              <li key={`${treino.data}-${indice}`} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base">
                    {formataData(treino.data)} · Treino {treino.letra}
                    <span className="text-fumaca"> {treino.titulo}</span>
                  </span>
                  {treino.percepcao && (
                    <span className="shrink-0 text-sm text-fumaca">
                      {ROTULO_PERCEPCAO[treino.percepcao]}
                    </span>
                  )}
                </div>
                {treino.comentario && (
                  <p className="mt-1 text-sm text-fumaca">
                    “{treino.comentario}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
