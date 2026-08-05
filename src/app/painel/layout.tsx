import Link from "next/link";
import { Marca } from "@/componentes/Marca";
import { sair } from "@/app/entrar/actions";

export default function Layout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-borda bg-carvao">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/painel">
            <Marca compacta />
          </Link>
          <form action={sair}>
            <button className="text-xs uppercase tracking-widest text-fumaca hover:text-gelo">
              Sair
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-3 pb-2 text-sm">
          <Link
            href="/painel/alunos"
            className="rounded-lg px-3 py-1.5 uppercase tracking-wider text-fumaca hover:bg-grafite hover:text-gelo"
          >
            Alunos
          </Link>
          <Link
            href="/painel/exercicios"
            className="rounded-lg px-3 py-1.5 uppercase tracking-wider text-fumaca hover:bg-grafite hover:text-gelo"
          >
            Exercícios
          </Link>
          <Link
            href="/painel/ajuda"
            className="rounded-lg px-3 py-1.5 uppercase tracking-wider text-fumaca hover:bg-grafite hover:text-gelo"
          >
            Ajuda
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {children}
      </main>
    </div>
  );
}
