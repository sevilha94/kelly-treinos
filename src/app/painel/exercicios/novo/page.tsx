import Link from "next/link";
import { FormularioExercicio } from "../FormularioExercicio";

export default function Page() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/painel/exercicios" className="text-sm text-fumaca hover:text-gelo">
        ‹ Voltar para a biblioteca
      </Link>
      <h1 className="titulo-pagina text-3xl">Novo exercício</h1>
      <FormularioExercicio />
    </div>
  );
}
