"use client";

import { useActionState, useState } from "react";
import { salvarExercicio, type EstadoExercicio } from "./actions";
import { Campo } from "@/componentes/Campo";
import { Botao } from "@/componentes/Botao";
import { MidiaExercicio } from "@/componentes/MidiaExercicio";
import { GRUPOS_MUSCULARES, type Exercicio } from "@/lib/tipos";

export function FormularioExercicio({
  exercicio,
}: {
  exercicio?: Exercicio;
}) {
  const [estado, acao, pendente] = useActionState<EstadoExercicio, FormData>(
    salvarExercicio,
    {},
  );
  // preview ao vivo: ela cola o link e ja confere se abriu a demonstracao certa
  const [midiaUrl, setMidiaUrl] = useState(exercicio?.midia_url ?? "");
  const [nome, setNome] = useState(exercicio?.nome ?? "");

  const buscaNoYoutube = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${nome} execução correta`,
  )}`;

  return (
    <form action={acao} className="space-y-4">
      {exercicio && <input type="hidden" name="id" value={exercicio.id} />}

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-fumaca">
          Nome do exercício
        </span>
        <input
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Supino barra"
          required
          className="w-full rounded-lg border border-borda bg-grafite px-3 py-2.5 text-base text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none"
        />
        <span className="mt-1 block text-xs text-fumaca">
          Pode mudar depois quando quiser — é só voltar aqui e editar.
        </span>
      </label>

      <Campo
        label="Grupo muscular"
        nome="grupo_muscular"
        valor={exercicio?.grupo_muscular}
        opcoes={GRUPOS_MUSCULARES}
        obrigatorio
      />

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-fumaca">
          Link da demonstração
        </span>
        <input
          name="midia_url"
          value={midiaUrl}
          onChange={(e) => setMidiaUrl(e.target.value)}
          placeholder="https://youtube.com/... ou link de uma imagem/GIF"
          className="w-full rounded-lg border border-borda bg-grafite px-3 py-2.5 text-base text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none"
        />
        <span className="mt-1 block text-xs text-fumaca">
          Serve imagem, GIF ou vídeo do YouTube. Dá para começar com imagem e
          trocar por vídeo depois.
        </span>
      </label>

      {nome.trim() && (
        <a
          href={buscaNoYoutube}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-lg border border-borda px-4 text-xs font-semibold uppercase tracking-wider text-gelo hover:border-fumaca"
        >
          Procurar “{nome.trim()}” no YouTube
        </a>
      )}

      <div>
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-fumaca">
          Prévia — é isso que o aluno vai ver
        </span>
        <MidiaExercicio url={midiaUrl} titulo={exercicio?.nome ?? "exercício"} />
      </div>

      <Campo
        label="Dica de execução"
        nome="dica"
        valor={exercicio?.dica ?? ""}
        multilinha
        placeholder="Desça a barra até a linha do peito e não trave o cotovelo lá em cima."
      />

      {estado.erro && <p className="text-sm text-sangue-claro">{estado.erro}</p>}

      <Botao type="submit" disabled={pendente} className="w-full">
        {pendente ? "Salvando..." : exercicio ? "Salvar alterações" : "Adicionar à biblioteca"}
      </Botao>
    </form>
  );
}
