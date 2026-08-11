import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cartao } from "@/componentes/Cartao";
import { FormularioAluno } from "../FormularioAluno";
import { LinkDoAluno } from "./LinkDoAluno";
import { EditorDeTreino } from "./EditorDeTreino";
import {
  alternarAcesso,
  arquivarAluno,
  copiarPlanilha,
  criarTreino,
  gerarNovoLink,
  salvarAgenda,
} from "../actions";
import { Avaliacoes } from "./Avaliacoes";
import { Cobranca } from "./Cobranca";
import type { Mensalidade } from "@/lib/mensalidades";
import {
  DIAS_SEMANA,
  type Aluno,
  type Avaliacao,
  type Exercicio,
  type Treino,
} from "@/lib/tipos";

export default async function Page(props: PageProps<"/painel/alunos/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [
    alunoRes,
    treinosRes,
    agendaRes,
    bibliotecaRes,
    acessosRes,
    outrosRes,
    avaliacoesRes,
    mensalidadesRes,
  ] = await Promise.all([
    supabase
      .from("aluno")
      .select("*")
      .eq("id", id)
      .is("arquivado_em", null)
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
      .eq("aluno_id", id)
      .is("arquivado_em", null)
      .is("itens.arquivado_em", null)
      .order("ordem")
      .order("ordem", { referencedTable: "treino_exercicio" }),
    supabase
      .from("aluno_agenda")
      .select("dia_semana, treino_id")
      .eq("aluno_id", id),
    supabase
      .from("exercicio")
      .select("id, nome, grupo_muscular, midia_url, dica")
      .is("arquivado_em", null)
      .order("grupo_muscular")
      .order("nome"),
    supabase
      .from("aluno_acesso")
      .select("dispositivo_id, aparelho, ultimo_em, visitas")
      .eq("aluno_id", id)
      .order("ultimo_em", { ascending: false }),
    supabase
      .from("aluno")
      .select("id, nome")
      .is("arquivado_em", null)
      .neq("id", id)
      .order("nome"),
    supabase
      .from("avaliacao")
      .select("*")
      .eq("aluno_id", id)
      .is("arquivado_em", null)
      .order("data", { ascending: false }),
    supabase
      .from("mensalidade")
      .select("*")
      .eq("aluno_id", id)
      .is("arquivado_em", null)
      .order("competencia", { ascending: false })
      .limit(6),
  ]);

  if (!alunoRes.data) notFound();

  const aluno = alunoRes.data as Aluno;
  const treinos = (treinosRes.data ?? []) as unknown as Treino[];
  const biblioteca = (bibliotecaRes.data ?? []) as Exercicio[];
  const acessos = (acessosRes.data ?? []) as Acesso[];
  const outros = (outrosRes.data ?? []) as { id: string; nome: string }[];
  const avaliacoes = (avaliacoesRes.data ?? []) as Avaliacao[];
  const mensalidades = (mensalidadesRes.data ?? []) as Mensalidade[];
  const agenda = new Map(
    (agendaRes.data ?? []).map((linha) => [linha.dia_semana, linha.treino_id]),
  );

  return (
    <div className="space-y-5">
      <Link
        href="/painel/alunos"
        className="text-sm text-fumaca hover:text-gelo"
      >
        ‹ Voltar para os alunos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo-pagina text-3xl">{aluno.nome}</h1>
        <Link
          href={`/painel/alunos/${aluno.id}/historico`}
          className="inline-flex h-10 items-center rounded-lg border border-borda px-4 text-xs font-semibold uppercase tracking-wider text-gelo hover:border-fumaca"
        >
          Ver histórico
        </Link>
      </div>
      <p className="text-sm text-fumaca">
        Cada botão salva na hora — não existe um “salvar tudo” no final. Pode
        fechar a página quando quiser que nada se perde.
      </p>

      <Cartao titulo="Link do aluno">
        <LinkDoAluno
          url={`${await origemDoSite()}/aluno/${aluno.token_link}`}
          nome={primeiroNome(aluno.nome)}
        />
        <ControleDeAcesso aluno={aluno} />
        <Aparelhos acessos={acessos} />
      </Cartao>

      <Cartao titulo="Semana">
        <form action={salvarAgenda} className="space-y-3 px-4 py-4">
          <input type="hidden" name="aluno_id" value={aluno.id} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIAS_SEMANA.map((dia) => (
              <label key={dia.numero} className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                  {dia.nome}
                </span>
                <select
                  name={`dia_${dia.numero}`}
                  defaultValue={agenda.get(dia.numero) ?? ""}
                  className="w-full rounded-lg border border-borda bg-grafite px-2 py-2 text-sm text-gelo focus:border-sangue focus:outline-none"
                >
                  <option value="">Descanso</option>
                  {treinos.map((treino) => (
                    <option key={treino.id} value={treino.id}>
                      {treino.letra}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <BotaoAcao variante="secundario" carregando="Salvando...">Salvar semana</BotaoAcao>
        </form>
      </Cartao>

      {biblioteca.length === 0 && (
        <p className="rounded-2xl border border-sangue-escuro bg-sangue-escuro/10 px-4 py-3 text-sm">
          A biblioteca está vazia.{" "}
          <Link href="/painel/exercicios/novo" className="underline">
            Cadastre os exercícios primeiro
          </Link>{" "}
          para conseguir montar os treinos.
        </p>
      )}

      <Cobranca aluno={aluno} mensalidades={mensalidades} />

      <Avaliacoes
        alunoId={aluno.id}
        avaliacoes={avaliacoes}
        alturaAtual={aluno.altura_cm}
      />

      <CopiarDeOutroAluno alunoId={aluno.id} outros={outros} />

      {treinos.map((treino) => (
        <EditorDeTreino
          key={treino.id}
          alunoId={aluno.id}
          treino={treino}
          biblioteca={biblioteca}
        />
      ))}

      <form action={criarTreino}>
        <input type="hidden" name="aluno_id" value={aluno.id} />
        <BotaoAcao
          variante="secundario"
          carregando="Criando..."
          className="h-11 w-full border-dashed text-sm"
        >
          + Adicionar outro treino
        </BotaoAcao>
      </form>

      <details className="rounded-2xl border border-borda bg-carvao">
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Dados do aluno
        </summary>
        <div className="space-y-5 px-4 pb-5">
          <FormularioAluno aluno={aluno} />
          <form action={arquivarAluno} className="border-t border-borda pt-4">
            <input type="hidden" name="id" value={aluno.id} />
            <BotaoAcao
              variante="texto"
              carregando="Arquivando..."
              confirmar="Arquivar este aluno? Ele sai da sua lista e o link dele para de funcionar."
            >
              Arquivar aluno
            </BotaoAcao>
          </form>
        </div>
      </details>
    </div>
  );
}

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0];
}

/** Monta o endereco do site a partir do proprio pedido, sem depender de config. */
async function origemDoSite() {
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

function CopiarDeOutroAluno({
  alunoId,
  outros,
}: {
  alunoId: string;
  outros: { id: string; nome: string }[];
}) {
  if (outros.length === 0) return null;

  return (
    <details className="rounded-2xl border border-borda bg-carvao">
      <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
        Copiar planilha de outro aluno
      </summary>
      <form action={copiarPlanilha} className="space-y-3 px-4 pb-4">
        <input type="hidden" name="aluno_id" value={alunoId} />
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
            Copiar os treinos de
          </span>
          <select
            name="origem_id"
            required
            className="w-full rounded-lg border border-borda bg-grafite px-3 py-2.5 text-base text-gelo focus:border-sangue focus:outline-none"
          >
            <option value="">Escolha o aluno...</option>
            {outros.map((outro) => (
              <option key={outro.id} value={outro.id}>
                {outro.nome}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs leading-relaxed text-fumaca">
          Traz os treinos com exercícios, séries e repetições, e você ajusta o
          que for diferente depois. Os treinos que já têm exercício aqui não são
          tocados — a cópia entra depois deles. A agenda da semana não vem junto.
        </p>
        <BotaoAcao carregando="Copiando..." className="h-10">
          Copiar
        </BotaoAcao>
      </form>
    </details>
  );
}

type Acesso = {
  dispositivo_id: string;
  aparelho: string | null;
  ultimo_em: string;
  visitas: number;
};

function Aparelhos({ acessos }: { acessos: Acesso[] }) {
  if (acessos.length === 0) return null;

  const suspeito = acessos.length >= 3;

  return (
    <details className="border-t border-borda">
      <summary className="cursor-pointer px-4 py-3 text-xs uppercase tracking-wider text-fumaca hover:text-gelo">
        {acessos.length === 1
          ? "1 aparelho abriu este link"
          : `${acessos.length} aparelhos abriram este link`}
        {suspeito && <span className="ml-2 text-sangue-claro">verificar</span>}
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <ul className="space-y-1.5">
          {acessos.map((acesso) => (
            <li
              key={acesso.dispositivo_id}
              className="flex justify-between gap-3 text-sm"
            >
              <span>{acesso.aparelho ?? "Aparelho desconhecido"}</span>
              <span className="text-fumaca">
                {new Date(acesso.ultimo_em).toLocaleDateString("pt-BR")} ·{" "}
                {acesso.visitas}×
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-fumaca">
          Isso é um indício, não uma prova: trocar de celular ou limpar o
          navegador também aparece como aparelho novo. Se desconfiar mesmo, gere
          um novo link acima.
        </p>
      </div>
    </details>
  );
}

function ControleDeAcesso({ aluno }: { aluno: Aluno }) {
  const bloqueado = Boolean(aluno.acesso_bloqueado_em);

  return (
    <div className="space-y-3 border-t border-borda px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            bloqueado
              ? "bg-sangue-escuro/30 text-sangue-claro"
              : "bg-grafite text-fumaca"
          }`}
        >
          {bloqueado ? "Acesso pausado" : "Acesso liberado"}
        </span>

        <form action={alternarAcesso}>
          <input type="hidden" name="id" value={aluno.id} />
          <input
            type="hidden"
            name="bloquear"
            value={bloqueado ? "nao" : "sim"}
          />
          <BotaoAcao variante="secundario" carregando="...">
            {bloqueado ? "Liberar de novo" : "Pausar acesso"}
          </BotaoAcao>
        </form>
      </div>

      <p className="text-xs leading-relaxed text-fumaca">
        {bloqueado
          ? "O aluno abre o link e vê um aviso pedindo para falar com você. É só clicar em liberar que ele volta a enxergar o treino."
          : "Pausar mantém o mesmo link: quando você liberar, ele volta a funcionar. Se o aluno repassou o link para outra pessoa, gere um novo — aí o antigo para de funcionar para sempre."}
      </p>

      <form action={gerarNovoLink}>
        <input type="hidden" name="id" value={aluno.id} />
        <BotaoAcao
          variante="texto"
          carregando="Gerando..."
          confirmar="Gerar um link novo? O link que o aluno tem hoje para de funcionar na hora, e você vai precisar enviar o novo para ele."
          className="text-xs uppercase tracking-wider"
        >
          Gerar novo link (o atual para de funcionar)
        </BotaoAcao>
      </form>
    </div>
  );
}
