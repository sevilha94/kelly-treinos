"use client";

import { useState } from "react";
import { adicionarItem } from "../actions";
import type { Exercicio } from "@/lib/tipos";
import { BotaoAcao } from "@/componentes/BotaoAcao";

const ENTRADA =
  "w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none";

/**
 * Escolher entre 136 exercicios numa lista corrida e inviavel, ainda mais no
 * celular. O filtro de grupo derruba a escolha para uma duzia de opcoes; sem
 * filtro, a lista ainda vem separada por grupo, que o proprio navegador desenha.
 */
export function AdicionarExercicio({
  alunoId,
  treinoId,
  biblioteca,
}: {
  alunoId: string;
  treinoId: string;
  biblioteca: Exercicio[];
}) {
  const [grupo, setGrupo] = useState("");

  const grupos = [...new Set(biblioteca.map((ex) => ex.grupo_muscular))];
  const filtrados = grupo
    ? biblioteca.filter((ex) => ex.grupo_muscular === grupo)
    : biblioteca;

  return (
    <form
      action={adicionarItem}
      className="flex flex-wrap items-end gap-2 border-t border-borda bg-preto/40 px-4 py-3"
    >
      <input type="hidden" name="aluno_id" value={alunoId} />
      <input type="hidden" name="treino_id" value={treinoId} />

      <label className="min-w-32 flex-1">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
          Grupo
        </span>
        <select
          value={grupo}
          onChange={(evento) => setGrupo(evento.target.value)}
          className={ENTRADA}
        >
          <option value="">Todos</option>
          {grupos.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-44 flex-1">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
          Exercício
        </span>
        {/* a key zera a escolha quando ela troca de grupo */}
        <select key={grupo} name="exercicio_id" required className={ENTRADA}>
          <option value="">
            {grupo ? `Escolha entre os ${filtrados.length}...` : "Escolha..."}
          </option>

          {grupo
            ? filtrados.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nome}
                </option>
              ))
            : grupos.map((nomeGrupo) => (
                <optgroup key={nomeGrupo} label={nomeGrupo}>
                  {biblioteca
                    .filter((ex) => ex.grupo_muscular === nomeGrupo)
                    .map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
        </select>
      </label>

      <label className="w-16">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
          Séries
        </span>
        <input name="series" defaultValue="4" className={ENTRADA} />
      </label>

      <label className="w-20">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
          Reps
        </span>
        <input name="repeticoes" defaultValue="12" className={ENTRADA} />
      </label>

      <BotaoAcao carregando="Adicionando...">Adicionar</BotaoAcao>
    </form>
  );
}
