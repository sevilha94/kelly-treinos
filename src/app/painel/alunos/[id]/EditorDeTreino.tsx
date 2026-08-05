import {
  arquivarTreino,
  moverItem,
  removerItem,
  salvarItem,
  salvarTreino,
} from "../actions";
import { Cartao, Vazio } from "@/componentes/Cartao";
import { AdicionarExercicio } from "./AdicionarExercicio";
import { nomeExibido, type Exercicio, type Treino } from "@/lib/tipos";

const ENTRADA =
  "w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none";

export function EditorDeTreino({
  alunoId,
  treino,
  biblioteca,
}: {
  alunoId: string;
  treino: Treino;
  biblioteca: Exercicio[];
}) {
  return (
    <Cartao titulo={`Treino ${treino.letra} — ${treino.titulo}`}>
      <form
        action={salvarTreino}
        className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3"
      >
        <input type="hidden" name="aluno_id" value={alunoId} />
        <input type="hidden" name="treino_id" value={treino.id} />
        <label className="w-16">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
            Letra
          </span>
          <input name="letra" defaultValue={treino.letra} className={ENTRADA} />
        </label>
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
            Nome do treino
          </span>
          <input
            name="titulo"
            defaultValue={treino.titulo}
            placeholder="Peito e ombro"
            className={ENTRADA}
          />
        </label>
        <button className="h-9 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-fumaca hover:border-fumaca hover:text-gelo">
          Salvar
        </button>
        <button
          formAction={arquivarTreino}
          className="h-9 rounded-lg px-3 text-xs uppercase tracking-wider text-fumaca hover:text-sangue-claro"
        >
          Excluir treino
        </button>
      </form>

      {treino.itens.length === 0 ? (
        <Vazio>Nenhum exercício neste treino ainda.</Vazio>
      ) : (
        <ul className="divide-y divide-borda">
          {treino.itens.map((item, indice) => (
            <li key={item.id}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-grafite">
                  <span className="min-w-0">
                    <span className="block truncate text-base">
                      {nomeExibido(item)}
                    </span>
                    <span className="text-xs text-fumaca">
                      {item.series} × {item.repeticoes}
                      {item.apelido && " · nome personalizado"}
                    </span>
                  </span>
                  <span aria-hidden className="text-fumaca group-open:hidden">
                    editar
                  </span>
                </summary>

                <form action={salvarItem} className="space-y-3 px-4 pb-4">
                  <input type="hidden" name="aluno_id" value={alunoId} />
                  <input type="hidden" name="item_id" value={item.id} />

                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                      Nome só nesta planilha
                    </span>
                    <input
                      name="apelido"
                      defaultValue={item.apelido ?? ""}
                      placeholder={item.exercicio.nome}
                      className={ENTRADA}
                    />
                    <span className="mt-1 block text-xs text-fumaca">
                      Deixe em branco para usar “{item.exercicio.nome}”, o nome
                      da biblioteca.
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                        Séries
                      </span>
                      <input
                        name="series"
                        defaultValue={item.series}
                        className={ENTRADA}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                        Repetições
                      </span>
                      <input
                        name="repeticoes"
                        defaultValue={item.repeticoes}
                        className={ENTRADA}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                      Observação para o aluno
                    </span>
                    <input
                      name="observacao"
                      defaultValue={item.observacao ?? ""}
                      placeholder="Descanso de 60 segundos"
                      className={ENTRADA}
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button className="h-9 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro">
                      Salvar
                    </button>
                    {indice > 0 && (
                      <button
                        formAction={moverItem}
                        name="direcao"
                        value="cima"
                        className="h-9 rounded-lg border border-borda px-3 text-xs text-fumaca hover:text-gelo"
                      >
                        ↑ subir
                      </button>
                    )}
                    {indice < treino.itens.length - 1 && (
                      <button
                        formAction={moverItem}
                        name="direcao"
                        value="baixo"
                        className="h-9 rounded-lg border border-borda px-3 text-xs text-fumaca hover:text-gelo"
                      >
                        ↓ descer
                      </button>
                    )}
                    <button
                      formAction={removerItem}
                      className="ml-auto h-9 px-2 text-xs text-fumaca hover:text-sangue-claro"
                    >
                      Tirar do treino
                    </button>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}

      <AdicionarExercicio
        alunoId={alunoId}
        treinoId={treino.id}
        biblioteca={biblioteca}
      />
    </Cartao>
  );
}
