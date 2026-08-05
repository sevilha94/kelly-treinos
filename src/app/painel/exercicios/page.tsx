import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { lerMidia } from "@/lib/midia";
import type { Exercicio } from "@/lib/tipos";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercicio")
    .select("id, nome, grupo_muscular, midia_url, dica")
    .is("arquivado_em", null)
    .order("grupo_muscular")
    .order("nome");

  const exercicios = (data ?? []) as Exercicio[];
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

      {exercicios.length === 0 ? (
        <Cartao titulo="Nenhum exercício ainda">
          <Vazio>
            Cadastre cada exercício uma única vez. Depois é só escolher da lista
            ao montar a planilha de qualquer aluno.
          </Vazio>
        </Cartao>
      ) : (
        porGrupo.map(([grupo, lista]) => (
          <Cartao key={grupo} titulo={grupo}>
            <ul className="divide-y divide-borda">
              {lista.map((ex) => (
                <li key={ex.id}>
                  <Link
                    href={`/painel/exercicios/${ex.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-grafite"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base">{ex.nome}</span>
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
          </Cartao>
        ))
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
