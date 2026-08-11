"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
import { Campo } from "@/componentes/Campo";
import { Botao } from "@/componentes/Botao";

export function FormularioLogin() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(
    entrar,
    {},
  );

  return (
    <form
      action={acao}
      className="rounded-2xl border border-borda bg-carvao p-6 space-y-4"
    >
      <Campo label="E-mail" nome="email" tipo="email" obrigatorio />
      <Campo label="Senha" nome="senha" tipo="password" obrigatorio />

      {estado.erro && (
        <p className="text-sm text-alerta">{estado.erro}</p>
      )}

      <Botao type="submit" disabled={pendente} className="w-full">
        {pendente ? "Entrando..." : "Entrar"}
      </Botao>
    </form>
  );
}
