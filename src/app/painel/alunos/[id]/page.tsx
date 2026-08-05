import Link from "next/link";
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
  criarTreino,
  gerarNovoLink,
  salvarAgenda,
} from "../actions";
import {
  DIAS_SEMANA,
  type Aluno,
  type Exercicio,
  type Treino,
} from "@/lib/tipos";

export default async function Page(props: PageProps<"/painel/alunos/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [alunoRes, treinosRes, agendaRes, bibliotecaRes, acessosRes] =
    await Promise.all([
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
           id, apelido, series, repeticoes, observacao, ordem,
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
    ]);

  if (!alunoRes.data) notFound();

  const aluno = alunoRes.data as Aluno;
  const treinos = (treinosRes.data ?? []) as unknown as Treino[];
  const biblioteca = (bibliotecaRes.data ?? []) as Exercicio[];
  const acessos = (acessosRes.data ?? []) as Acesso[];
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
      <h1 className="titulo-marca text-3xl">{aluno.nome}</h1>

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
          <button className="h-10 rounded-lg border border-borda px-4 text-xs uppercase tracking-wider text-gelo hover:border-fumaca">
            Salvar semana
          </button>
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
        <button className="h-11 w-full rounded-lg border border-dashed border-borda text-sm uppercase tracking-wider text-fumaca hover:border-fumaca hover:text-gelo">
          + Adicionar outro treino
        </button>
      </form>

      <details className="rounded-2xl border border-borda bg-carvao">
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Dados do aluno
        </summary>
        <div className="space-y-5 px-4 pb-5">
          <FormularioAluno aluno={aluno} />
          <form action={arquivarAluno} className="border-t border-borda pt-4">
            <input type="hidden" name="id" value={aluno.id} />
            <button className="text-sm text-fumaca hover:text-sangue-claro">
              Arquivar aluno
            </button>
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
          <button className="h-9 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-gelo hover:border-fumaca">
            {bloqueado ? "Liberar de novo" : "Pausar acesso"}
          </button>
        </form>
      </div>

      <p className="text-xs leading-relaxed text-fumaca">
        {bloqueado
          ? "O aluno abre o link e vê um aviso pedindo para falar com você. É só clicar em liberar que ele volta a enxergar o treino."
          : "Pausar mantém o mesmo link: quando você liberar, ele volta a funcionar. Se o aluno repassou o link para outra pessoa, gere um novo — aí o antigo para de funcionar para sempre."}
      </p>

      <form action={gerarNovoLink}>
        <input type="hidden" name="id" value={aluno.id} />
        <button className="text-xs uppercase tracking-wider text-fumaca hover:text-sangue-claro">
          Gerar novo link (o atual para de funcionar)
        </button>
      </form>
    </div>
  );
}
