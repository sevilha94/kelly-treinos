import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { salvarHoraDoLembrete } from "./alunos/actions";
import { Cartao, Vazio } from "@/componentes/Cartao";
import {
  frequenciaPorAluno,
  situacao,
  TOM_CLASSE,
  type Frequencia,
} from "@/lib/frequencia";
import {
  emAbertoPorAluno,
  nomeDaCompetencia,
  situacaoMensalidade,
} from "@/lib/mensalidades";

export default async function Page() {
  const supabase = await createClient();

  const [alunosRes, exerciciosRes, frequencias, emAberto, configRes] =
    await Promise.all([
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
      emAbertoPorAluno(supabase),
      supabase
        .from("configuracao")
        .select("valor")
        .eq("chave", "hora_lembrete")
        .maybeSingle(),
    ]);

  const horaLembrete = Number(configRes.data?.valor ?? 7);

  const alunos = alunosRes.data ?? [];

  // quem esta sumido ha mais tempo aparece primeiro: e quem precisa de contato
  const porAusencia = [...alunos].sort((a, b) => {
    const diasA = frequencias.get(a.id)?.diasSemTreinar ?? Infinity;
    const diasB = frequencias.get(b.id)?.diasSemTreinar ?? Infinity;
    return diasB - diasA;
  });

  // quem passou de 7 dias fica sempre a vista; o resto so quando ela pedir,
  // porque aluno em dia e justamente o que ela nao precisa olhar
  const sumidos = porAusencia.filter((aluno) => {
    const dias = frequencias.get(aluno.id)?.diasSemTreinar;
    return dias === undefined || dias === null || dias > 7;
  });
  const emDia = porAusencia.filter((aluno) => !sumidos.includes(aluno));

  // mensalidade vencida, da mais atrasada para a menos
  const devendo = alunos
    .map((aluno) => ({
      aluno,
      situacao: situacaoMensalidade(emAberto.get(aluno.id)),
    }))
    .filter((linha) => (linha.situacao?.diasDeAtraso ?? 0) > 0)
    .sort((a, b) => b.situacao!.diasDeAtraso - a.situacao!.diasDeAtraso);

  return (
    <div className="space-y-6">
      <Abertura />

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

      <Cartao titulo="Quem sumiu">
        {alunos.length === 0 ? (
          <Vazio>Nenhum aluno cadastrado ainda.</Vazio>
        ) : (
          <>
            {sumidos.length === 0 ? (
              <Vazio>
                Ninguém sumido. Todo mundo treinou nos últimos 7 dias.
              </Vazio>
            ) : (
              <Lista alunos={sumidos} frequencias={frequencias} />
            )}

            {emDia.length > 0 && (
              <details className="border-t border-borda">
                <summary className="cursor-pointer px-4 py-3 text-xs uppercase tracking-wider text-fumaca hover:text-gelo">
                  Ver os outros {emDia.length}{" "}
                  {emDia.length === 1 ? "aluno" : "alunos"}
                </summary>
                <Lista alunos={emDia} frequencias={frequencias} />
              </details>
            )}
          </>
        )}
      </Cartao>

      {devendo.length > 0 && (
        <Cartao titulo="Mensalidade em atraso">
          <ul className="divide-y divide-borda">
            {devendo.map(({ aluno, situacao: sit }) => (
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
                      {nomeDaCompetencia(emAberto.get(aluno.id)!.competencia)} ·
                      R${" "}
                      {Number(emAberto.get(aluno.id)!.valor)
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm ${TOM_CLASSE[sit!.tom]}`}>
                    {sit!.texto}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <details className="rounded-2xl border border-borda bg-carvao">
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Lembrete no celular dos alunos
        </summary>
        <form action={salvarHoraDoLembrete} className="space-y-3 px-4 pb-4">
          <p className="text-sm leading-relaxed text-fumaca">
            Todo dia, nesse horário, quem tem treino marcado na agenda recebe um
            aviso no celular. Quem já treinou naquele dia não é incomodado.
          </p>
          <label className="block w-32">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
              Horário
            </span>
            <select
              name="hora"
              defaultValue={horaLembrete}
              className="w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo focus:border-sangue focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, hora) => (
                <option key={hora} value={hora}>
                  {String(hora).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <BotaoAcao variante="secundario" carregando="Salvando...">Salvar horário</BotaoAcao>
          <p className="text-xs text-fumaca">
            O aluno só recebe se tiver ligado o lembrete no link dele. No
            iPhone, ele precisa antes adicionar o treino à tela de início.
          </p>
        </form>
      </details>

      <p className="text-sm leading-relaxed text-fumaca">
        Só entram nesta conta os treinos que o aluno finalizou pelo link. Quem
        treina sem marcar aparece como sumido — vale combinar isso com ele.
      </p>
    </div>
  );
}

/**
 * Faixa de abertura do painel.
 *
 * A foto e quadrada e o recorte aqui e largo e baixo, entao o object-position
 * puxa para cima: e onde esta o rosto dela. O degrade termina na cor exata da
 * pagina, para a foto morrer no fundo em vez de virar um retangulo colado.
 */
function Abertura() {
  return (
    <section className="relative -mx-5 -mt-6 h-64 overflow-hidden sm:mx-0 sm:mt-0 sm:h-80 sm:rounded-2xl">
      <Image
        src="/KELLYFOTO.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 100vw, 64rem"
        className="object-cover object-[50%_12%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-preto via-preto/45 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-6">
        <span className="block text-[11px] uppercase tracking-[0.28em] text-fumaca">
          Kelly Jhuly · Personal trainer
        </span>
        <h1 className="titulo-marca text-4xl leading-none">Painel</h1>
      </div>
    </section>
  );
}

function Lista({
  alunos,
  frequencias,
}: {
  alunos: { id: string; nome: string }[];
  frequencias: Map<string, Frequencia>;
}) {
  return (
    <ul className="divide-y divide-borda">
      {alunos.map((aluno) => {
        const freq = frequencias.get(aluno.id);
        const { texto, tom } = situacao(freq);

        return (
          <li key={aluno.id}>
            <Link
              href={`/painel/alunos/${aluno.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-grafite"
            >
              <span className="min-w-0">
                <span className="block truncate text-base">{aluno.nome}</span>
                <span className="text-xs text-fumaca">
                  {freq?.treinosNoMes ?? 0} treinos nos últimos 30 dias
                </span>
              </span>
              <span className={`shrink-0 text-sm ${TOM_CLASSE[tom]}`}>
                {texto}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
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
