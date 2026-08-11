import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { salvarChavePix, salvarHoraDoLembrete } from "./alunos/actions";
import { AvisosNoCelular } from "./AvisosNoCelular";
import { Cartao, Vazio } from "@/componentes/Cartao";
import {
  frequenciaPorAluno,
  situacao,
  TOM_CLASSE,
  type Frequencia,
} from "@/lib/frequencia";
import {
  emAbertoPorAluno,
  nivelDaMensalidade,
  nomeDaCompetencia,
  ROTULO_NIVEL,
  type Nivel,
} from "@/lib/mensalidades";

/** Mais grave primeiro: e a ordem em que ela precisa agir. */
const ORDEM_NIVEL: Record<Nivel, number> = {
  bloqueada: 0,
  critica: 1,
  conferir: 2,
  atrasada: 3,
  em_dia: 4,
  paga: 5,
};

const COR_NIVEL: Record<Nivel, string> = {
  bloqueada: "text-sangue-claro",
  critica: "text-sangue-claro",
  conferir: "text-amber-400",
  atrasada: "text-amber-400",
  em_dia: "text-fumaca",
  paga: "text-fumaca",
};

export default async function Page() {
  const supabase = await createClient();

  const [
    alunosRes,
    exerciciosRes,
    frequencias,
    emAberto,
    configRes,
    avisosRes,
  ] = await Promise.all([
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
    supabase.from("configuracao").select("chave, valor"),
    supabase
      .from("painel_lembrete")
      .select("id", { count: "exact", head: true })
      .is("desativado_em", null),
  ]);

  const config = new Map(
    (configRes.data ?? []).map((linha) => [linha.chave, linha.valor]),
  );
  const horaLembrete = Number(config.get("hora_lembrete") ?? 7);
  const chavePix = config.get("chave_pix") ?? "";
  const titularPix = config.get("titular_pix") ?? "";

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

  // da mais grave para a menos: bloqueado, critico, atrasado, e comprovante
  // esperando conferencia dela
  const cobrancas = alunos
    .map((aluno) => ({
      aluno,
      mensalidade: emAberto.get(aluno.id),
      ...nivelDaMensalidade(emAberto.get(aluno.id)),
    }))
    .filter((linha) => linha.nivel !== "em_dia" && linha.nivel !== "paga")
    .sort(
      (a, b) =>
        ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel] ||
        b.diasDeAtraso - a.diasDeAtraso,
    );

  const bloqueados = cobrancas.filter((c) => c.nivel === "bloqueada").length;
  const aConferir = cobrancas.filter((c) => c.nivel === "conferir").length;

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
        {/* so ocupa espaco quando ha o que conferir: contador zerado e ruido */}
        {aConferir > 0 && (
          <Atalho
            href="#mensalidade"
            numero={aConferir}
            rotulo={
              aConferir === 1
                ? "comprovante para conferir"
                : "comprovantes para conferir"
            }
            alerta
          />
        )}
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

      {cobrancas.length > 0 && (
        <div id="mensalidade" className="scroll-mt-4">
          <Cartao
            titulo={
              bloqueados > 0
                ? `Mensalidade — ${bloqueados} com acesso pausado`
                : aConferir > 0
                  ? "Mensalidade — comprovante para conferir"
                  : "Mensalidade"
            }
          >
            <ul className="divide-y divide-borda">
              {cobrancas.map(({ aluno, mensalidade, nivel, diasDeAtraso }) => (
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
                        {nomeDaCompetencia(mensalidade!.competencia)} · R${" "}
                        {Number(mensalidade!.valor)
                          .toFixed(2)
                          .replace(".", ",")}
                        {diasDeAtraso > 0 && ` · ${diasDeAtraso} dias`}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm ${COR_NIVEL[nivel]}`}>
                      {ROTULO_NIVEL[nivel]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      )}

      <details
        className="rounded-2xl border border-borda bg-carvao"
        open={!chavePix}
      >
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Chave Pix para receber
          {!chavePix && (
            <span className="ml-2 text-sangue-claro">falta preencher</span>
          )}
        </summary>
        <form action={salvarChavePix} className="space-y-3 px-4 pb-4">
          <p className="text-sm leading-relaxed text-fumaca">
            É o que o aluno vê na hora de pagar. Sem isso ele não tem para onde
            mandar o Pix.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Chave Pix
              </span>
              <input
                name="chave_pix"
                defaultValue={chavePix}
                placeholder="CPF, celular, e-mail ou aleatória"
                className="w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Nome do titular
              </span>
              <input
                name="titular_pix"
                defaultValue={titularPix}
                placeholder="Kelly Jhuly ..."
                className="w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none"
              />
            </label>
          </div>
          <BotaoAcao variante="secundario" carregando="Salvando...">
            Salvar chave
          </BotaoAcao>
          <p className="text-xs text-fumaca">
            Só quem tem o link de aluno enxerga isso — não fica público.
          </p>
        </form>
      </details>

      <AvisosNoCelular jaLigado={(avisosRes.count ?? 0) > 0} />

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
          <BotaoAcao variante="secundario" carregando="Salvando...">
            Salvar horário
          </BotaoAcao>
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
        <h1 className="titulo-pagina text-4xl leading-none">Painel</h1>
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
      <span className="block numero text-4xl text-sangue">{numero}</span>
      <span className="text-sm uppercase tracking-wider text-fumaca">
        {rotulo}
      </span>
    </Link>
  );
}
