import Link from "next/link";
import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAcesso, COOKIE_DISPOSITIVO } from "@/lib/acessos";
import {
  consultaDeSessoes,
  montarSessoes,
  formataCarga,
  type MarcaDeCarga,
} from "@/lib/sessoes";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { CronometroDescanso } from "./CronometroDescanso";
import { Feedback } from "./Feedback";
import { Lembretes } from "./Lembretes";
import { MidiaExercicio } from "@/componentes/MidiaExercicio";
import { Marca } from "@/componentes/Marca";
import { marcarExercicio, finalizarTreino } from "./actions";

import {
  deveBloquearPorAtraso,
  nomeDaCompetencia,
  situacaoMensalidade,
  type Mensalidade,
} from "@/lib/mensalidades";
import {
  DIAS_SEMANA,
  MEDIDAS,
  calculaImc,
  formataData,
  nomeExibido,
  type Aluno,
  type Avaliacao,
  type Treino,
} from "@/lib/tipos";

export async function generateMetadata(
  props: PageProps<"/aluno/[token]">,
): Promise<Metadata> {
  const { token } = await props.params;

  return {
    title: "Meu treino — Kelly Jhuly",
    // a planilha é pessoal: nao queremos ela indexada em buscador nenhum
    robots: { index: false, follow: false },
    // manifesto proprio de cada aluno, para o atalho na tela inicial abrir a
    // planilha dele e nao a tela de login
    manifest: `/aluno/${token}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: "Meu treino",
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function Page(props: PageProps<"/aluno/[token]">) {
  const { token } = await props.params;
  const { t } = await props.searchParams;

  const supabase = createAdminClient();

  // "*" de proposito: assim a pagina nao quebra se uma coluna nova ainda nao
  // existir no banco — o deploy do codigo e a migracao nao precisam ser no
  // mesmo minuto
  const { data: alunoData } = await supabase
    .from("aluno")
    .select("*")
    .eq("token_link", token)
    .is("arquivado_em", null)
    .maybeSingle();

  if (!alunoData) notFound();
  const aluno = alunoData as Pick<
    Aluno,
    | "id"
    | "nome"
    | "objetivo"
    | "token_link"
    | "acesso_bloqueado_em"
    | "bloquear_por_atraso"
    | "dias_tolerancia"
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

  // tudo o que depende so do aluno vai junto: cada etapa a mais e uma ida e
  // volta ate o banco que o aluno espera de pe na academia
  const [
    mensalidadeRes,
    treinosRes,
    agendaRes,
    avaliacoesRes,
    lembretesRes,
    sessoesRes,
  ] = await Promise.all([
    supabase
      .from("mensalidade")
      .select("*")
      .eq("aluno_id", aluno.id)
      .is("pago_em", null)
      .is("arquivado_em", null)
      .order("vencimento")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("treino")
      .select(
        `id, letra, titulo, ordem,
         itens:treino_exercicio(
           id, apelido, series, repeticoes, observacao, descanso_segundos, ordem,
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
    supabase
      .from("avaliacao")
      .select("*")
      .eq("aluno_id", aluno.id)
      .is("arquivado_em", null)
      .order("data", { ascending: false })
      .limit(2),
    supabase
      .from("aluno_lembrete")
      .select("id", { count: "exact", head: true })
      .eq("aluno_id", aluno.id)
      .is("desativado_em", null),
    consultaDeSessoes(supabase, aluno.id),
  ]);

  const emAberto = (mensalidadeRes.data ?? undefined) as
    Mensalidade | undefined;

  // so bloqueia se a Kelly ligou isso neste aluno e a tolerancia ja passou
  if (deveBloquearPorAtraso(aluno, emAberto)) {
    return (
      <Moldura nome={aluno.nome}>
        <div className="space-y-3 px-5 py-16 text-center">
          <p className="titulo-marca text-2xl">Mensalidade em aberto</p>
          <p className="text-sm leading-relaxed text-fumaca">
            A mensalidade de {nomeDaCompetencia(emAberto!.competencia)} está
            pendente. Assim que acertar com a Kelly, seu treino volta na hora.
          </p>
        </div>
      </Moldura>
    );
  }

  // registro de aparelho nao pode segurar a pagina: vai depois da resposta
  const dispositivoId = (await cookies()).get(COOKIE_DISPOSITIVO)?.value;
  const userAgent = (await headers()).get("user-agent");
  after(() => registrarAcesso(aluno.id, dispositivoId, userAgent));

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

  const { finalizadaEm, percepcao, comentario, marcacoes, historico } =
    await montarSessoes(supabase, sessoesRes.data, treino.id, dataDeHoje());

  const avaliacoes = (avaliacoesRes.data ?? []) as Avaliacao[];
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
          const marcas = historico.get(item.id) ?? [];
          const ultima = marcas[0];

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
                      {ultima && ` · última: ${formataCarga(ultima.carga)} kg`}
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

                  {item.descanso_segundos ? (
                    <CronometroDescanso segundos={item.descanso_segundos} />
                  ) : null}

                  <Evolucao marcas={marcas} />

                  <form
                    action={marcarExercicio}
                    className="flex items-end gap-2"
                  >
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
                        placeholder={ultima ? formataCarga(ultima.carga) : "—"}
                        className="w-full rounded-lg border border-borda bg-grafite px-3 py-2.5 text-base text-gelo focus:border-sangue focus:outline-none"
                      />
                    </label>
                    <BotaoAcao
                      name="feito"
                      value={feito ? "nao" : "sim"}
                      variante={feito ? "secundario" : "principal"}
                      carregando={feito ? "Tirando..." : "Marcando..."}
                      className="h-11 flex-1 text-sm"
                    >
                      {feito ? "Desmarcar" : "Fiz este"}
                    </BotaoAcao>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <AvisoDeMensalidade emAberto={emAberto} />

      <Lembretes token={token} jaLigado={(lembretesRes.count ?? 0) > 0} />

      <MinhasMedidas avaliacoes={avaliacoes} />

      <div className="px-5 py-6">
        {finalizadaEm ? (
          <div className="space-y-3 rounded-xl border border-sangue bg-sangue-escuro/15 px-4 py-5 text-center">
            <p className="titulo-marca text-2xl text-sangue-claro">
              Treino concluído
            </p>
            <p className="text-sm text-fumaca">
              Você finalizou às {horaDe(finalizadaEm)}. A Kelly já está vendo
              aqui.
            </p>

            <Feedback
              token={token}
              treinoId={treino.id}
              percepcao={percepcao}
              comentario={comentario}
            />

            <form action={finalizarTreino}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="treino_id" value={treino.id} />
              <input type="hidden" name="desfazer" value="sim" />
              <BotaoAcao
                variante="texto"
                carregando="Desfazendo..."
                className="text-xs uppercase tracking-wider underline"
              >
                Desfazer
              </BotaoAcao>
            </form>
          </div>
        ) : (
          <form action={finalizarTreino}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="treino_id" value={treino.id} />
            <BotaoAcao
              carregando="Finalizando..."
              className="h-12 w-full rounded-xl text-sm font-bold tracking-widest"
            >
              Finalizar treino de hoje
            </BotaoAcao>
          </form>
        )}
      </div>

      <p className="px-5 pb-10 text-center text-xs uppercase tracking-[0.2em] text-fumaca">
        Você é o responsável pela sua mudança
      </p>
    </Moldura>
  );
}

/**
 * Aviso discreto de mensalidade. So aparece a partir do vencimento — antes
 * disso e cobranca antecipada, e nao e esse o papel da tela de treino.
 */
function AvisoDeMensalidade({ emAberto }: { emAberto?: Mensalidade }) {
  const sit = situacaoMensalidade(emAberto);
  if (!sit || sit.diasDeAtraso === 0) return null;

  return (
    <p className="mx-5 mt-4 rounded-lg border border-sangue-escuro bg-sangue-escuro/10 px-3 py-2.5 text-sm leading-relaxed">
      Mensalidade de {nomeDaCompetencia(emAberto!.competencia)} em aberto — fale
      com a Kelly quando puder.
    </p>
  );
}

/**
 * As medidas da ultima avaliacao, com quanto mudou desde a anterior. Fica
 * recolhido: quem abriu o app quer treinar, e ver medida e outra intencao.
 */
function MinhasMedidas({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (avaliacoes.length === 0) return null;

  const [atual, anterior] = avaliacoes;
  const linhas = MEDIDAS.filter(
    ({ campo }) => (atual[campo] as number | null) !== null,
  );

  const imcAtual = calculaImc(atual.peso_kg, atual.altura_cm);
  if (linhas.length === 0 && imcAtual === null) return null;

  return (
    <details className="border-b border-borda">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <span className="text-sm uppercase tracking-wider text-fumaca">
          Minhas medidas
        </span>
        <span className="text-xs text-fumaca">{formataData(atual.data)} ▸</span>
      </summary>

      <ul className="space-y-1.5 px-5 pb-5">
        {linhas.map(({ campo, rotulo, unidade }) => {
          const valor = atual[campo] as number;
          const antes = anterior?.[campo] as number | null | undefined;
          const delta =
            antes === null || antes === undefined
              ? null
              : Math.round((Number(valor) - Number(antes)) * 10) / 10;

          return (
            <li
              key={campo}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="text-sm text-fumaca">{rotulo}</span>
              <span className="text-sm tabular-nums">
                {formataCarga(Number(valor))}
                {unidade && (
                  <span className="text-xs text-fumaca"> {unidade}</span>
                )}
                {delta !== null && delta !== 0 && (
                  <span className="ml-2 text-xs text-fumaca">
                    {delta > 0 ? "+" : "−"}
                    {formataCarga(Math.abs(delta))}
                  </span>
                )}
              </span>
            </li>
          );
        })}

        {imcAtual !== null && (
          <li className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-fumaca">IMC</span>
            <span className="text-sm tabular-nums">
              {formataCarga(imcAtual)}
            </span>
          </li>
        )}
      </ul>
    </details>
  );
}

/**
 * Evolucao de carga daquele exercicio. So aparece a partir da segunda marcacao,
 * porque com um ponto so nao ha o que comparar. As barras vao da mais antiga
 * para a mais recente, que e como a pessoa le progresso.
 */
function Evolucao({ marcas }: { marcas: MarcaDeCarga[] }) {
  if (marcas.length < 2) return null;

  const ultimas = marcas.slice(0, 8).reverse();
  const maior = Math.max(...ultimas.map((m) => m.carga));
  const primeira = ultimas[0].carga;
  const atual = ultimas[ultimas.length - 1].carga;
  const diferenca = Math.round((atual - primeira) * 10) / 10;

  return (
    <div className="rounded-lg border border-borda bg-grafite/60 px-3 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest text-fumaca">
          Sua evolução
        </span>
        {diferenca !== 0 && (
          <span
            className={`text-xs ${diferenca > 0 ? "text-sangue-claro" : "text-fumaca"}`}
          >
            {diferenca > 0 ? "+" : "−"}
            {formataCarga(Math.abs(diferenca))} kg desde{" "}
            {formataData(ultimas[0].data)}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        {ultimas.map((marca, indice) => {
          const altura = Math.max(8, Math.round((marca.carga / maior) * 44));
          const ehUltima = indice === ultimas.length - 1;

          return (
            <div key={`${marca.data}-${indice}`} className="flex-1 text-center">
              <span className="mb-1 block text-[10px] text-fumaca">
                {formataCarga(marca.carga)}
              </span>
              <span
                aria-hidden
                style={{ height: `${altura}px` }}
                className={`block w-full rounded-sm ${ehUltima ? "bg-sangue" : "bg-borda"}`}
              />
              <span className="mt-1 block text-[9px] text-fumaca">
                {formataData(marca.data).slice(0, 5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
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

function dataDeHoje() {
  return new Date().toISOString().slice(0, 10);
}

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
