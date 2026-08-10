import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { lerMidia } from "@/lib/midia";
import { preencherBiblioteca, restaurarExercicio } from "./actions";
import { comunsFaltando } from "@/lib/exerciciosComuns";
import { idDoGrupo, type Exercicio } from "@/lib/tipos";

export default async function Page(props: PageProps<"/painel/exercicios">) {
  const { sem, g, excluido } = await props.searchParams;
  const soSemMidia = sem === "1";
  // grupo que acabou de receber um exercicio: chega aberto e com a pagina rolada
  const grupoDestacado = typeof g === "string" ? g : undefined;
  const acabouDeExcluir = excluido === "1";

  const supabase = await createClient();
  const [{ data }, { data: dadosArquivados }] = await Promise.all([
    supabase
      .from("exercicio")
      .select("id, nome, grupo_muscular, midia_url, dica")
      .is("arquivado_em", null)
      .order("grupo_muscular")
      .order("nome"),
    supabase
      .from("exercicio")
      .select("id, nome, grupo_muscular, midia_url, dica")
      .not("arquivado_em", "is", null)
      .order("arquivado_em", { ascending: false }),
  ]);

  const todos = (data ?? []) as Exercicio[];
  const arquivados = (dadosArquivados ?? []) as Exercicio[];
  const semMidia = todos.filter((ex) => !ex.midia_url?.trim());
  const faltando = comunsFaltando(todos.map((ex) => ex.nome));
  const exercicios = soSemMidia ? semMidia : todos;
  const porGrupo = agruparPorGrupo(exercicios);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="titulo-marca text-3xl">Biblioteca</h1>
        <Link
          href="/painel/exercicios/novo"
          className="inline-flex h-11 items-center rounded-lg bg-sangue px-4 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro"
        >
          Novo exercício
        </Link>
      </div>

      {acabouDeExcluir && (
        // some sozinho na proxima navegacao, porque vive no endereco
        <p className="rounded-2xl border border-borda bg-carvao px-4 py-3 text-sm">
          Exercício excluído. Se foi sem querer, ele está em{" "}
          <strong>Exercícios excluídos</strong>, no fim desta página.
        </p>
      )}

      {todos.length === 0 ? (
        <Cartao titulo="Comece por aqui">
          <div className="space-y-4 px-4 py-5">
            <p className="text-sm leading-relaxed text-fumaca">
              Posso cadastrar de uma vez os exercícios mais comuns de academia,
              com nome e grupo muscular já preenchidos. Depois você entra em
              cada um e cola o link do vídeo, no seu ritmo.
            </p>
            <form action={preencherBiblioteca}>
              <BotaoAcao carregando="Cadastrando..." className="h-11 px-5 text-sm">
                Preencher com exercícios comuns
              </BotaoAcao>
            </form>
            <p className="text-xs text-fumaca">
              Não apaga nem altera nada do que você já cadastrou.
            </p>
          </div>
        </Cartao>
      ) : (
        <>
          {/* some sozinho quando nao falta nenhum: ja cumpriu o papel */}
          {faltando.length > 0 && (
            <details className="rounded-2xl border border-borda bg-carvao">
              <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
                Faltam {faltando.length} exercícios comuns de academia
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <p className="text-sm leading-relaxed text-fumaca">
                  Cadastra de uma vez os {faltando.length} que ainda não estão
                  aqui, com nome e grupo muscular já preenchidos. Eles entram sem
                  vídeo — o vídeo é você quem escolhe depois.
                </p>
                <form action={preencherBiblioteca}>
                  <BotaoAcao carregando="Adicionando..." className="h-10">
                    Adicionar os que faltam
                  </BotaoAcao>
                </form>
                <p className="text-xs text-fumaca">
                  Não apaga nem altera nada do que você já cadastrou. Pode clicar
                  sem medo.
                </p>
              </div>
            </details>
          )}

          {semMidia.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-borda bg-carvao px-4 py-3">
              <span className="text-sm text-fumaca">
                {semMidia.length} de {todos.length}{" "}
                {semMidia.length === 1 ? "está" : "estão"} sem demonstração
              </span>
              <Link
                href={soSemMidia ? "/painel/exercicios" : "/painel/exercicios?sem=1"}
                className="ml-auto text-xs uppercase tracking-wider text-sangue-claro hover:underline"
              >
                {soSemMidia ? "Ver todos" : "Ver só esses"}
              </Link>
            </div>
          )}

          {exercicios.length === 0 ? (
            <Cartao>
              <Vazio>Todos os exercícios já têm demonstração.</Vazio>
            </Cartao>
          ) : (
            porGrupo.map(([grupo, lista]) => (
              <details
                key={grupo}
                id={idDoGrupo(grupo)}
                // filtrando, ela esta trabalhando na lista: melhor tudo aberto
                open={soSemMidia || grupo === grupoDestacado}
                className="group scroll-mt-4 overflow-hidden rounded-2xl border border-borda bg-carvao"
              >
                <summary className="faixa flex cursor-pointer list-none items-center gap-3 px-4 py-2.5">
                  <span
                    aria-hidden
                    className="text-white transition-transform group-open:rotate-90"
                  >
                    ▸
                  </span>
                  <h2 className="titulo-marca flex-1 text-lg text-white">
                    {grupo}
                  </h2>
                  <span className="text-xs tabular-nums text-white/75">
                    {lista.length}
                  </span>
                </summary>

                <ul className="divide-y divide-borda">
                  {lista.map((ex) => (
                    <li key={ex.id}>
                      <Link
                        href={`/painel/exercicios/${ex.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-grafite"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-base">
                            {ex.nome}
                          </span>
                          <span className="text-xs text-fumaca">
                            {rotuloDaMidia(ex.midia_url)}
                          </span>
                        </span>
                        <span aria-hidden className="text-fumaca">
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))
          )}
        </>
      )}

      {arquivados.length > 0 && (
        // fechado por padrao: e o cesto de lixo, nao a biblioteca. Mas precisa
        // existir, senao excluir vira decisao sem volta e ela deixa de excluir
        <details className="rounded-2xl border border-borda bg-carvao">
          <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
            {arquivados.length === 1
              ? "1 exercício excluído"
              : `${arquivados.length} exercícios excluídos`}
          </summary>
          <ul className="divide-y divide-borda border-t border-borda">
            {arquivados.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base">{ex.nome}</span>
                  <span className="text-xs text-fumaca">
                    {ex.grupo_muscular}
                  </span>
                </span>
                <form action={restaurarExercicio}>
                  <input type="hidden" name="id" value={ex.id} />
                  <BotaoAcao variante="secundario" carregando="Trazendo...">
                    Trazer de volta
                  </BotaoAcao>
                </form>
              </li>
            ))}
          </ul>
          <p className="px-4 py-3 text-xs text-fumaca">
            Excluído some da biblioteca e da lista de montar planilha. As
            planilhas que já usam continuam mostrando o exercício normalmente.
          </p>
        </details>
      )}
    </div>
  );
}

function agruparPorGrupo(exercicios: Exercicio[]): [string, Exercicio[]][] {
  const mapa = new Map<string, Exercicio[]>();
  for (const ex of exercicios) {
    const lista = mapa.get(ex.grupo_muscular) ?? [];
    lista.push(ex);
    mapa.set(ex.grupo_muscular, lista);
  }
  return [...mapa.entries()];
}

function rotuloDaMidia(url: string | null) {
  const midia = lerMidia(url);
  if (midia.tipo === "vazio") return "Sem demonstração";
  if (midia.tipo === "youtube") return "Vídeo do YouTube";
  if (midia.tipo === "video") return "Vídeo";
  return "Imagem ou GIF";
}
