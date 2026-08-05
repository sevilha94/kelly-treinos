import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { frequenciaPorAluno, situacao, TOM_CLASSE } from "@/lib/frequencia";

export default async function Page() {
  const supabase = await createClient();

  const [alunosRes, exerciciosRes, frequencias] = await Promise.all([
    supabase
      .from("aluno")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
    supabase
      .from("exercicio")
      .select("id", { count: "exact", head: true })
      .is("arquivado_em", null),
    frequenciaPorAluno(supabase),
  ]);

  const alunos = alunosRes.data ?? [];

  // quem esta sumido ha mais tempo aparece primeiro: e quem precisa de contato
  const porAusencia = [...alunos].sort((a, b) => {
    const diasA = frequencias.get(a.id)?.diasSemTreinar ?? Infinity;
    const diasB = frequencias.get(b.id)?.diasSemTreinar ?? Infinity;
    return diasB - diasA;
  });

  const sumidos = porAusencia.filter((aluno) => {
    const dias = frequencias.get(aluno.id)?.diasSemTreinar;
    return dias === undefined || dias === null || dias > 7;
  });

  return (
    <div className="space-y-6">
      <h1 className="titulo-marca text-3xl">Painel</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Atalho
          href="/painel/alunos"
          numero={alunos.length}
          rotulo="alunos ativos"
        />
        <Atalho
          href="/painel/exercicios"
          numero={exerciciosRes.count ?? 0}
          rotulo="exercícios na biblioteca"
        />
        <Atalho
          href="/painel/alunos"
          numero={sumidos.length}
          rotulo="sem treinar há mais de 7 dias"
          alerta={sumidos.length > 0}
        />
      </div>

      <Cartao titulo="Quem treinou e quem sumiu">
        {alunos.length === 0 ? (
          <Vazio>Nenhum aluno cadastrado ainda.</Vazio>
        ) : (
          <ul className="divide-y divide-borda">
            {porAusencia.map((aluno) => {
              const freq = frequencias.get(aluno.id);
              const { texto, tom } = situacao(freq);

              return (
                <li key={aluno.id}>
                  <Link
                    href={`/painel/alunos/${aluno.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-grafite"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base">
                        {aluno.nome}
                      </span>
                      <span className="text-xs text-fumaca">
                        {freq?.treinosNoMes ?? 0} treinos nos últimos 30 dias
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-sm ${TOM_CLASSE[tom]}`}
                    >
                      {texto}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      <p className="text-sm leading-relaxed text-fumaca">
        Só entram nesta conta os treinos que o aluno finalizou pelo link. Quem
        treina sem marcar aparece como sumido — vale combinar isso com ele.
      </p>
    </div>
  );
}

function Atalho({
  href,
  numero,
  rotulo,
  alerta = false,
}: {
  href: string;
  numero: number;
  rotulo: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-carvao p-5 transition-colors hover:border-sangue ${
        alerta ? "border-sangue-escuro" : "border-borda"
      }`}
    >
      <span className="block titulo-marca text-4xl text-sangue">{numero}</span>
      <span className="text-sm uppercase tracking-wider text-fumaca">
        {rotulo}
      </span>
    </Link>
  );
}
