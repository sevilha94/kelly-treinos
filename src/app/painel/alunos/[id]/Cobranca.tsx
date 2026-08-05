import { Cartao, Vazio } from "@/componentes/Cartao";
import { alternarPagamento, gerarMensalidade, salvarCobranca } from "../actions";
import { TOM_CLASSE } from "@/lib/frequencia";
import {
  competenciaAtual,
  nomeDaCompetencia,
  situacaoMensalidade,
  type Mensalidade,
} from "@/lib/mensalidades";
import { formataData } from "@/lib/tipos";

const ENTRADA =
  "w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none";

export function Cobranca({
  aluno,
  mensalidades,
}: {
  aluno: {
    id: string;
    valor_mensalidade: number | null;
    dia_vencimento: number | null;
    bloquear_por_atraso: boolean;
    dias_tolerancia: number;
  };
  mensalidades: Mensalidade[];
}) {
  const jaTemDoMes = mensalidades.some(
    (m) => m.competencia.slice(0, 10) === competenciaAtual(),
  );

  return (
    <Cartao titulo="Mensalidade">
      {mensalidades.length === 0 ? (
        <Vazio>
          Nenhuma mensalidade lançada. Combine o valor abaixo e gere a do mês.
        </Vazio>
      ) : (
        <ul className="divide-y divide-borda">
          {mensalidades.map((mensalidade) => {
            const sit = situacaoMensalidade(mensalidade)!;
            const paga = Boolean(mensalidade.pago_em);

            return (
              <li
                key={mensalidade.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base capitalize">
                    {nomeDaCompetencia(mensalidade.competencia)}
                  </span>
                  <span className="text-xs text-fumaca">
                    R$ {Number(mensalidade.valor).toFixed(2).replace(".", ",")} ·
                    vence {formataData(mensalidade.vencimento)}
                    {paga && mensalidade.forma && ` · ${mensalidade.forma}`}
                  </span>
                </span>

                <span className={`text-sm ${TOM_CLASSE[sit.tom]}`}>
                  {sit.texto}
                </span>

                <form action={alternarPagamento}>
                  <input type="hidden" name="aluno_id" value={aluno.id} />
                  <input
                    type="hidden"
                    name="mensalidade_id"
                    value={mensalidade.id}
                  />
                  <input type="hidden" name="pagar" value={paga ? "nao" : "sim"} />
                  <button
                    className={`h-9 rounded-lg px-3 text-xs font-semibold uppercase tracking-wider ${
                      paga
                        ? "border border-borda text-fumaca hover:text-gelo"
                        : "bg-sangue text-white hover:bg-sangue-claro"
                    }`}
                  >
                    {paga ? "Desfazer" : "Marcar paga"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {aluno.valor_mensalidade && !jaTemDoMes && (
        <form action={gerarMensalidade} className="border-t border-borda px-4 py-3">
          <input type="hidden" name="aluno_id" value={aluno.id} />
          <button className="h-10 rounded-lg border border-borda px-4 text-xs font-semibold uppercase tracking-wider text-gelo hover:border-fumaca">
            Lançar a mensalidade de {nomeDaCompetencia(competenciaAtual())}
          </button>
        </form>
      )}

      <details className="border-t border-borda">
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Valor e vencimento
        </summary>
        <form action={salvarCobranca} className="space-y-3 px-4 pb-4">
          <input type="hidden" name="aluno_id" value={aluno.id} />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Valor (R$)
              </span>
              <input
                name="valor_mensalidade"
                inputMode="decimal"
                defaultValue={aluno.valor_mensalidade ?? ""}
                placeholder="250"
                className={ENTRADA}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Dia do vencimento
              </span>
              <input
                name="dia_vencimento"
                inputMode="numeric"
                defaultValue={aluno.dia_vencimento ?? ""}
                placeholder="10"
                className={ENTRADA}
              />
            </label>
          </div>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="bloquear_por_atraso"
              value="sim"
              defaultChecked={aluno.bloquear_por_atraso}
              className="mt-1 h-4 w-4 shrink-0 accent-[#d61f26]"
            />
            <span className="text-sm text-gelo">
              Pausar o treino sozinho quando atrasar
              <span className="mt-0.5 block text-xs text-fumaca">
                Nasce desligado de propósito: se você esquecer de marcar um Pix
                que entrou, o aluno perde o treino sem motivo.
              </span>
            </span>
          </label>

          <label className="block w-40">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
              Dias de tolerância
            </span>
            <input
              name="dias_tolerancia"
              inputMode="numeric"
              defaultValue={aluno.dias_tolerancia}
              className={ENTRADA}
            />
          </label>

          <button className="h-10 rounded-lg bg-sangue px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sangue-claro">
            Salvar
          </button>
        </form>
      </details>
    </Cartao>
  );
}
