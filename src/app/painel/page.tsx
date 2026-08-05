import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  const [alunos, exercicios] = await Promise.all([
    supabase
      .from("aluno")
      .select("id", { count: "exact", head: true })
      .is("arquivado_em", null),
    supabase
      .from("exercicio")
      .select("id", { count: "exact", head: true })
      .is("arquivado_em", null),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="titulo-marca text-3xl">Painel</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Atalho
          href="/painel/alunos"
          numero={alunos.count ?? 0}
          rotulo="alunos ativos"
        />
        <Atalho
          href="/painel/exercicios"
          numero={exercicios.count ?? 0}
          rotulo="exercícios na biblioteca"
        />
      </div>

      <p className="text-sm leading-relaxed text-fumaca">
        Comece cadastrando os exercícios na biblioteca — cada um com o link de
        uma imagem, GIF ou vídeo. Depois monte a planilha de cada aluno e envie
        o link dele pelo WhatsApp.
      </p>
    </div>
  );
}

function Atalho({
  href,
  numero,
  rotulo,
}: {
  href: string;
  numero: number;
  rotulo: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-borda bg-carvao p-5 transition-colors hover:border-sangue"
    >
      <span className="block titulo-marca text-4xl text-sangue">{numero}</span>
      <span className="text-sm uppercase tracking-wider text-fumaca">
        {rotulo}
      </span>
    </Link>
  );
}
