"use client";

import { useActionState } from "react";
import { salvarAluno, type EstadoAluno } from "./actions";
import { Campo } from "@/componentes/Campo";
import { Botao } from "@/componentes/Botao";
import type { Aluno } from "@/lib/tipos";

export function FormularioAluno({ aluno }: { aluno?: Aluno }) {
  const [estado, acao, pendente] = useActionState<EstadoAluno, FormData>(
    salvarAluno,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      {aluno && <input type="hidden" name="id" value={aluno.id} />}

      <Campo label="Nome" nome="nome" valor={aluno?.nome} obrigatorio />
      <Campo
        label="WhatsApp"
        nome="telefone"
        valor={aluno?.telefone ?? ""}
        placeholder="(12) 99999-9999"
      />

      <div className="grid grid-cols-2 gap-3">
        <Campo
          label="Nascimento"
          nome="data_nascimento"
          tipo="date"
          valor={aluno?.data_nascimento ?? ""}
        />
        <Campo
          label="Peso (kg)"
          nome="peso_kg"
          valor={aluno?.peso_kg ?? ""}
          placeholder="73"
        />
      </div>

      <Campo
        label="Altura (cm)"
        nome="altura_cm"
        valor={aluno?.altura_cm ?? ""}
        placeholder="171"
      />
      <Campo
        label="Objetivo"
        nome="objetivo"
        valor={aluno?.objetivo ?? ""}
        placeholder="Hipertrofia e perda de gordura"
      />

      <div className="grid grid-cols-2 gap-3">
        <Campo
          label="Mensalidade (R$)"
          nome="valor_mensalidade"
          valor={aluno?.valor_mensalidade ?? ""}
          placeholder="250"
        />
        <Campo
          label="Vence todo dia"
          nome="dia_vencimento"
          valor={aluno?.dia_vencimento ?? ""}
          placeholder="10"
          ajuda="De 1 a 28, combinado com ele."
        />
      </div>
      <Campo
        label="Observações"
        nome="observacoes"
        valor={aluno?.observacoes ?? ""}
        multilinha
        placeholder="Lesão no ombro direito, evitar desenvolvimento acima da cabeça."
      />

      {estado.erro && <p className="text-sm text-sangue-claro">{estado.erro}</p>}

      <Botao type="submit" disabled={pendente} className="w-full">
        {pendente ? "Salvando..." : aluno ? "Salvar alterações" : "Cadastrar aluno"}
      </Botao>
    </form>
  );
}
