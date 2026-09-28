"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/painel/alunos", rotulo: "Alunos" },
  { href: "/painel/exercicios", rotulo: "Exercícios" },
  { href: "/painel/ajuda", rotulo: "Ajuda" },
] as const;

/** Marca onde ela esta: sem isso as tres abas pareciam iguais em toda tela. */
export function MenuDoPainel() {
  const caminho = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 px-3 text-sm">
      {ITENS.map(({ href, rotulo }) => {
        const ativo = caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border-b-2 px-3 uppercase tracking-wider hover:text-gelo ${
              ativo ? "border-sangue text-gelo" : "border-transparent text-fumaca"
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
