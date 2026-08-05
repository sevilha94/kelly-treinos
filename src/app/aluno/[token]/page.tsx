import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAcesso } from "@/lib/acessos";
import { MidiaExercicio } from "@/componentes/MidiaExercicio";
import { Marca } from "@/componentes/Marca";
import { marcarExercicio, finalizarTreino } from "./actions";
import {
  DIAS_SEMANA,
  nomeExibido,
  type Aluno,
  type Treino,
} from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Meu treino — Kelly Jhuly",
  // a planilha é pessoal: nao queremos ela indexada em buscador nenhum
  robots: { index: false, follow: false },
};

type Marcacao = { feito: boolean; carga_kg: number | null };

export default async function Page(props: PageProps<"/aluno/[token]">) {
  const { token } = await props.params;
  const { t } = await props.searchParams;

  const supabase = createAdminClient();

  const { data: alunoData } = await supabase
    .from("aluno")
    .select("id, nome, token_link, objetivo, acesso_bloqueado_em")
    .eq("token_link", token)
    .is("arquivado_em", null)
    .maybeSingle();

  if (!alunoData) notFound();
  const aluno = alunoData as Pick<
    Aluno,
    "id" | "nome" | "objetivo" | "token_link" | "acesso_bloqueado_em"
  >;

  // acesso pausado pela Kelly: nada da planilha e carregado
  if (aluno.acesso_bloqueado_em) {
    return (
      <Moldura nome={aluno.nome}>
        <div className="space-y-3 px-5 py-16 text-center">
          <p className="titulo-marca text-2xl">Acesso pausado</p>
          <p className="text-sm leading-relaxed text-fumaca">
            Seu treino está temporariamente indisponível. Fale com a Kelly para
            liberar de novo.
          </p>
        </div>
      </Moldura>
    );
  }

  await registrarAcesso(aluno.id);

  const [treinosRes, agendaRes] = await Promise.all([
    supabase
      .from("treino")
      .select(
        `id, letra, titulo, ordem,
         itens:treino_exercicio(
           id, apelido, series, repeticoes, observacao, ordem,
           exercicio:exercicio_id(id, nome, grupo_muscular, midia_url, dica)
         )`,
      )
      .eq("aluno_id", aluno.id)
      .is("arquivado_em", null)
      .is("itens.arquivado_em", null)
      .order("ordem")
      .order("ordem", { referencedTable: "treino_exercicio" }),
    supabase
      .from("aluno_agenda")
      .select("dia_semana, treino_id")
      .eq("aluno_id", aluno.id),
  ]);

  const treinos = (treinosRes.data ?? []) as unknown as Treino[];

  if (treinos.length === 0) {
    return (
      <Moldura nome={aluno.nome}>
        <p className="px-5 py-16 text-center text-fumaca">
          Sua planilha ainda está sendo montada. Em breve a Kelly libera aqui.
        </p>
      </Moldura>
    );
  }

  const hoje = diaDaSemanaAtual();
  const treinoDeHoje = (agendaRes.data ?? []).find(
    (linha) => linha.dia_semana === hoje,
  )?.treino_id;

  const letraEscolhida = typeof t === "string" ? t : undefined;
  const treino =
    treinos.find((item) => item.letra === letraEscolhida) ??
    treinos.find((item) => item.id === treinoDeHoje) ??
    treinos[0];

  const marcacoes = await marcacoesDeHoje(aluno.id, treino.id);
  const feitos = treino.itens.filter((item) => marcacoes.get(item.id)?.feito);

  return (
    <Moldura nome={aluno.nome}>
      <nav className="flex gap-2 overflow-x-auto px-5 py-3">
        {treinos.map((item) => {
          const ativo = item.id === treino.id;
          return (
            <Link
              key={item.id}
              href={`/aluno/${token}?t=${item.letra}`}
              className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-4 text-base font-semibold transition-colors ${
                ativo
                  ? "bg-sangue text-white"
                  : "border border-borda text-fumaca"
              }`}
            >
              {item.letra}
              {item.id === treinoDeHoje && (
                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </Link>
          );
        })}
      </nav>

      <header className="px-5 pb-4">
        <h1 className="titulo-marca text-3xl leading-tight">
          Treino {treino.letra} — {treino.titulo}
        </h1>
        <p className="text-sm text-fumaca">
          {treino.id === treinoDeHoje
            ? `Hoje é ${DIAS_SEMANA[hoje - 1].nome.toLowerCase()}, o dia deste treino.`
            : "Toque em qualquer exercício para ver como executar."}{" "}
          {feitos.length > 0 &&
            `${feitos.length} de ${treino.itens.length} concluídos hoje.`}
        </p>
      </header>

      <ul className="divide-y divide-borda border-y border-borda">
        {treino.itens.map((item) => {
          const marcacao = marcacoes.get(item.id);
          const feito = marcacao?.feito ?? false;

          return (
            <li key={item.id} className={feito ? "bg-grafite/40" : undefined}>
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                      feito
                        ? "border-sangue bg-sangue text-white"
                        : "border-borda text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-base leading-snug ${feito ? "text-fumaca line-through" : ""}`}
                    >
                      {nomeExibido(item)}
                    </span>
                    <span className="text-xs text-fumaca">
                      {item.series} séries · {item.repeticoes} repetições
                    </span>
                  </span>
                  <span aria-hidden className="text-lg text-sangue">
                    ▸
                  </span>
                </summary>

                <div className="space-y-3 px-5 pb-5">
                  <MidiaExercicio
                    url={item.exercicio.midia_url}
                    titulo={nomeExibido(item)}
                  />

                  {item.exercicio.dica && (
                    <p className="rounded-lg border-l-2 border-sangue bg-grafite px-3 py-2 text-sm leading-relaxed">
                      {item.exercicio.dica}
                    </p>
                  )}
                  {item.observacao && (
                    <p className="text-sm text-fumaca">{item.observacao}</p>
                  )}

                  <form action={marcarExercicio} className="flex items-end gap-2">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="treino_id" value={treino.id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <label className="w-28">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                        Carga (kg)
                      </span>
                      <input
                        name="carga_kg"
                        inputMode="decimal"
                        defaultValue={marcacao?.carga_kg ?? ""}
                        placeholder="—"
                        className="w-full rounded-lg border border-borda bg-grafite px-3 py-2.5 text-base text-gelo focus:border-sangue focus:outline-none"
                      />
                    </label>
                    <button
                      name="feito"
                      value={feito ? "nao" : "sim"}
                      className={`h-11 flex-1 rounded-lg text-sm font-semibold uppercase tracking-wider ${
                        feito
                          ? "border border-borda text-fumaca"
                          : "bg-sangue text-white"
                      }`}
                    >
                      {feito ? "Desmarcar" : "Fiz este"}
                    </button>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <form action={finalizarTreino} className="px-5 py-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="treino_id" value={treino.id} />
        <button className="h-12 w-full rounded-xl bg-sangue text-sm font-bold uppercase tracking-widest text-white">
          Finalizar treino de hoje
        </button>
      </form>

      <p className="px-5 pb-10 text-center text-xs uppercase tracking-[0.2em] text-fumaca">
        Você é o responsável pela sua mudança
      </p>
    </Moldura>
  );
}

function Moldura({
  nome,
  children,
}: {
  nome: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md flex-1">
      <header className="flex items-center justify-between gap-3 border-b border-borda px-5 py-4">
        <Marca compacta />
        <span className="truncate text-sm text-fumaca">{nome}</span>
      </header>
      {children}
    </div>
  );
}

/** Segunda = 1 ... domingo = 7, para bater com a agenda salva no banco. */
function diaDaSemanaAtual() {
  const domingoZero = new Date().getDay();
  return domingoZero === 0 ? 7 : domingoZero;
}

async function marcacoesDeHoje(alunoId: string, treinoId: string) {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: sessao } = await supabase
    .from("sessao")
    .select("id")
    .eq("aluno_id", alunoId)
    .eq("treino_id", treinoId)
    .eq("data", hoje)
    .maybeSingle();

  const marcacoes = new Map<string, Marcacao>();
  if (!sessao) return marcacoes;

  const { data: itens } = await supabase
    .from("sessao_item")
    .select("treino_exercicio_id, feito, carga_kg")
    .eq("sessao_id", sessao.id);

  for (const item of itens ?? []) {
    marcacoes.set(item.treino_exercicio_id, {
      feito: item.feito,
      carga_kg: item.carga_kg,
    });
  }
  return marcacoes;
}
