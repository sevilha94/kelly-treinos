import {
  arquivarTreino,
  moverItem,
  removerItem,
  salvarItem,
  salvarTreino,
} from "../actions";
import { BotaoAcao } from "@/componentes/BotaoAcao";
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
        <BotaoAcao variante="secundario" carregando="Salvando...">Salvar</BotaoAcao>
        <BotaoAcao
          formAction={arquivarTreino}
          variante="perigo"
          carregando="Excluindo..."
          confirmar={`Excluir o treino ${treino.letra}? Os exercícios dele saem da planilha do aluno.`}
        >
          Excluir treino
        </BotaoAcao>
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

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                        Descanso (segundos)
                      </span>
                      <input
                        name="descanso_segundos"
                        inputMode="numeric"
                        defaultValue={item.descanso_segundos ?? ""}
                        placeholder="60"
                        className={ENTRADA}
                      />
                      <span className="mt-1 block text-xs text-fumaca">
                        Vira um cronômetro na tela dele.
                      </span>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                        Observação para o aluno
                      </span>
                      <input
                        name="observacao"
                        defaultValue={item.observacao ?? ""}
                        placeholder="Segurar 2s no topo"
                        className={ENTRADA}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BotaoAcao carregando="Salvando...">Salvar</BotaoAcao>
                    {indice > 0 && (
                      <BotaoAcao
                        formAction={moverItem}
                        name="direcao"
                        value="cima"
                        variante="secundario"
                        carregando="..."
                      >
                        ↑ subir
                      </BotaoAcao>
                    )}
                    {indice < treino.itens.length - 1 && (
                      <BotaoAcao
                        formAction={moverItem}
                        name="direcao"
                        value="baixo"
                        variante="secundario"
                        carregando="..."
                      >
                        ↓ descer
                      </BotaoAcao>
                    )}
                    <BotaoAcao
                      formAction={removerItem}
                      variante="perigo"
                      carregando="Tirando..."
                      className="ml-auto"
                    >
                      Tirar do treino
                    </BotaoAcao>
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
