import { enviarFeedback } from "./actions";
import { ROTULO_PERCEPCAO, type Percepcao } from "@/lib/sessoes";

/**
 * Como o treino foi para o aluno. So aparece depois de finalizar — perguntar
 * antes seria pedir opiniao sobre algo que ele ainda esta fazendo.
 *
 * Tres botoes em vez de campo aberto: no fim do treino, ninguem escreve. O
 * comentario fica opcional, para quem tiver algo a dizer.
 */
export function Feedback({
  token,
  treinoId,
  percepcao,
  comentario,
}: {
  token: string;
  treinoId: string;
  percepcao: Percepcao | null;
  comentario: string | null;
}) {
  const opcoes = Object.keys(ROTULO_PERCEPCAO) as Percepcao[];

  return (
    <div className="space-y-2 border-t border-sangue-escuro/40 pt-3">
      <p className="text-xs uppercase tracking-widest text-fumaca">
        Como foi para você?
      </p>

      <div className="flex gap-2">
        {opcoes.map((opcao) => (
          <form key={opcao} action={enviarFeedback} className="flex-1">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="treino_id" value={treinoId} />
            <input type="hidden" name="percepcao" value={opcao} />
            <button
              className={`h-10 w-full rounded-lg text-xs font-semibold uppercase tracking-wider ${
                percepcao === opcao
                  ? "bg-sangue text-white"
                  : "border border-borda text-fumaca"
              }`}
            >
              {ROTULO_PERCEPCAO[opcao]}
            </button>
          </form>
        ))}
      </div>

      {percepcao && (
        <form action={enviarFeedback} className="flex gap-2">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="treino_id" value={treinoId} />
          <input
            name="comentario"
            defaultValue={comentario ?? ""}
            placeholder="Quer contar algo para a Kelly?"
            className="min-w-0 flex-1 rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none"
          />
          <button className="h-10 shrink-0 rounded-lg border border-borda px-3 text-xs uppercase tracking-wider text-gelo">
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
