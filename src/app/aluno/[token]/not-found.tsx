import { Marca } from "@/componentes/Marca";

/** Link antigo (a Kelly gerou outro) ou digitado errado. */
export default function LinkInvalido() {
  return (
    <div className="mx-auto w-full max-w-md flex-1">
      <header className="border-b border-borda px-5 py-4">
        <Marca compacta />
      </header>
      <div className="space-y-3 px-5 py-16 text-center">
        <p className="titulo-marca text-2xl">Este link não vale mais</p>
        <p className="text-sm leading-relaxed text-fumaca">
          Peça o link novo do seu treino para a Kelly.
        </p>
      </div>
    </div>
  );
}
