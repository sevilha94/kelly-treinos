import Link from "next/link";
import { FormularioAluno } from "../FormularioAluno";

export default function Page() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/painel/alunos" className="text-sm text-fumaca hover:text-gelo">
        ‹ Voltar para os alunos
      </Link>
      <h1 className="titulo-pagina text-3xl">Novo aluno</h1>
      <p className="text-sm text-fumaca">
        Os treinos A, B, C e D já são criados vazios. Depois é só escolher os
        exercícios de cada um.
      </p>
      <FormularioAluno />
    </div>
  );
}
