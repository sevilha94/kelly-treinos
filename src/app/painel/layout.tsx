import Link from "next/link";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { Marca } from "@/componentes/Marca";
import { sair } from "@/app/entrar/actions";
import { MenuDoPainel } from "./MenuDoPainel";

export default function Layout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-borda bg-carvao">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/painel">
            <Marca compacta />
          </Link>
          <form action={sair}>
            <BotaoAcao
              variante="texto"
              carregando="Saindo..."
              className="text-xs uppercase tracking-widest"
            >
              Sair
            </BotaoAcao>
          </form>
        </div>
        <MenuDoPainel />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {children}
      </main>
    </div>
  );
}
