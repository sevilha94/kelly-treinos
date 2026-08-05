import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { lerMidia } from "@/lib/midia";
import { preencherBiblioteca } from "./actions";
import { idDoGrupo, type Exercicio } from "@/lib/tipos";

export default async function Page(props: PageProps<"/painel/exercicios">) {
  const { sem, g } = await props.searchParams;
  const soSemMidia = sem === "1";
  // grupo que acabou de receber um exercicio: chega aberto e com a pagina rolada
  const grupoDestacado = typeof g === "string" ? g : undefined;

  const supabase = await createClient();
  const { data } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular, midia_url, dica")
    .is("arquivado_em", null)
    .order("grupo_muscular")
    .order("nome");

  const todos = (data ?? []) as Exercicio[];
  const semMidia = todos.filter((ex) => !ex.midia_url?.trim());
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

      {todos.length === 0 ? (
        <Cartao titulo="Comece por aqui">
          <div className="space-y-4 px-4 py-5">
            <p className="text-sm leading-relaxed text-fumaca">
              Posso cadastrar de uma vez os exercícios mais comuns de academia,
              com nome e grupo muscular já preenchidos. Depois você entra em
              cada um e cola o link do vídeo, no seu ritmo.
            </p>
            <form action={preencherBiblioteca}>
              <button className="h-11 rounded-lg bg-sangue px-5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro">
                Preencher com exercícios comuns
              </button>
            </form>
            <p className="text-xs text-fumaca">
              Não apaga nem altera nada do que você já cadastrou.
            </p>
          </div>
        </Cartao>
      ) : (
        <>
          <details className="rounded-2xl border border-borda bg-carvao">
            <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
              Adicionar os exercícios comuns de academia
            </summary>
            <div className="space-y-3 px-4 pb-4">
              <p className="text-sm leading-relaxed text-fumaca">
                Cadastra de uma vez cerca de 130 exercícios com nome e grupo
                muscular já preenchidos, para você não precisar digitar um por
                um. Eles entram sem vídeo — o vídeo é você quem escolhe depois.
              </p>
              <form action={preencherBiblioteca}>
                <button className="h-10 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro">
                  Preencher com exercícios comuns
                </button>
              </form>
              <p className="text-xs text-fumaca">
                Não apaga nem altera nada do que você já cadastrou, e o que já
                existe não entra duplicado. Pode clicar sem medo.
              </p>
            </div>
          </details>

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
