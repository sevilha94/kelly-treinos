import { Cartao, Vazio } from "@/componentes/Cartao";
import { BotaoAcao } from "@/componentes/BotaoAcao";
import { arquivarAvaliacao, salvarAvaliacao } from "../actions";
import {
  MEDIDAS,
  calculaImc,
  formataData,
  type Avaliacao,
} from "@/lib/tipos";

const ENTRADA =
  "w-full rounded-lg border border-borda bg-grafite px-3 py-2 text-sm text-gelo placeholder:text-fumaca/60 focus:border-sangue focus:outline-none";

/** Sem casa decimal quando o numero e redondo: 73 kg, nao 73,00 kg. */
function formataNumero(valor: number | null): string {
  if (valor === null || valor === undefined) return "—";
  const arredondado = Math.round(Number(valor) * 10) / 10;
  return Number.isInteger(arredondado)
    ? String(arredondado)
    : arredondado.toFixed(1).replace(".", ",");
}

export function Avaliacoes({
  alunoId,
  avaliacoes,
  alturaAtual,
}: {
  alunoId: string;
  avaliacoes: Avaliacao[];
  alturaAtual: number | null;
}) {
  // da mais recente para a mais antiga; mostramos ate quatro lado a lado
  const colunas = avaliacoes.slice(0, 4);

  return (
    <Cartao titulo="Avaliação física">
      {colunas.length === 0 ? (
        <Vazio>
          Nenhuma avaliação registrada. A primeira vira a base de comparação das
          próximas.
        </Vazio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm">
            <thead>
              <tr className="border-b border-borda text-left">
                <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-fumaca">
                  Medida
                </th>
                {colunas.map((avaliacao, indice) => (
                  <th
                    key={avaliacao.id}
                    className={`px-3 py-2 text-right text-xs ${indice === 0 ? "text-gelo" : "text-fumaca"}`}
                  >
                    {formataData(avaliacao.data)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEDIDAS.map((medida) => {
                const { campo, rotulo, unidade } = medida;
                const valores = colunas.map((a) => a[campo] as number | null);
                if (valores.every((v) => v === null)) return null;

                const par = "par" in medida ? medida.par : undefined;
                const outroLado = par
                  ? (colunas[0]?.[par] as number | null)
                  : null;

                return (
                  <tr key={campo} className="border-b border-borda/50">
                    <td className="px-4 py-2 text-fumaca">
                      {rotulo}
                      <Assimetria deste={valores[0]} doOutro={outroLado} />
                    </td>
                    {valores.map((valor, indice) => (
                      <td
                        key={colunas[indice].id}
                        className={`px-3 py-2 text-right tabular-nums ${indice === 0 ? "text-gelo" : "text-fumaca"}`}
                      >
                        {formataNumero(valor)}
                        {valor !== null && unidade && (
                          <span className="text-[10px] text-fumaca">
                            {" "}
                            {unidade}
                          </span>
                        )}
                        {indice === 0 && <Diferenca valores={valores} />}
                      </td>
                    ))}
                  </tr>
                );
              })}

              <tr>
                <td className="px-4 py-2 text-fumaca">IMC</td>
                {colunas.map((avaliacao, indice) => (
                  <td
                    key={avaliacao.id}
                    className={`px-3 py-2 text-right tabular-nums ${indice === 0 ? "text-gelo" : "text-fumaca"}`}
                  >
                    {formataNumero(
                      calculaImc(
                        avaliacao.peso_kg,
                        avaliacao.altura_cm ?? alturaAtual,
                      ),
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {colunas.some((a) => a.observacoes) && (
        <div className="space-y-1 border-t border-borda px-4 py-3">
          {colunas
            .filter((a) => a.observacoes)
            .map((a) => (
              <p key={a.id} className="text-xs text-fumaca">
                <span className="text-gelo">{formataData(a.data)}:</span>{" "}
                {a.observacoes}
              </p>
            ))}
        </div>
      )}

      <details className="border-t border-borda">
        <summary className="cursor-pointer px-4 py-3 text-sm uppercase tracking-wider text-fumaca hover:text-gelo">
          Nova avaliação
        </summary>
        <form action={salvarAvaliacao} className="space-y-3 px-4 pb-4">
          <input type="hidden" name="aluno_id" value={alunoId} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Data
              </span>
              <input
                type="date"
                name="data"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={ENTRADA}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                Altura (cm)
              </span>
              <input
                name="altura_cm"
                inputMode="numeric"
                defaultValue={alturaAtual ?? ""}
                className={ENTRADA}
              />
            </label>

            {MEDIDAS.map(({ campo, rotulo, unidade }) => (
              <label key={campo} className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
                  {rotulo}
                  {unidade && ` (${unidade})`}
                </span>
                <input
                  name={campo}
                  inputMode="decimal"
                  placeholder="—"
                  className={ENTRADA}
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-fumaca">
              Observações
            </span>
            <input
              name="observacoes"
              placeholder="Evoluiu bem no quadríceps, manter o volume."
              className={ENTRADA}
            />
          </label>

          <p className="text-xs text-fumaca">
            Deixe em branco o que não mediu — a tela só mostra as medidas que
            têm valor.
          </p>

          <BotaoAcao carregando="Salvando..." className="h-10">
            Salvar avaliação
          </BotaoAcao>
        </form>
      </details>

      {colunas.length > 0 && (
        <form
          action={arquivarAvaliacao}
          className="border-t border-borda px-4 py-3"
        >
          <input type="hidden" name="aluno_id" value={alunoId} />
          <input type="hidden" name="avaliacao_id" value={colunas[0].id} />
          <BotaoAcao
            variante="texto"
            carregando="Apagando..."
            confirmar="Apagar esta avaliação física?"
            className="text-xs"
          >
            Apagar a avaliação de {formataData(colunas[0].data)}
          </BotaoAcao>
        </form>
      )}
    </Cartao>
  );
}

/**
 * Diferenca entre o lado direito e o esquerdo na avaliacao mais recente.
 *
 * Aparece so quando os dois lados foram medidos, e so a partir de 1 cm — abaixo
 * disso e variacao de fita metrica, nao assimetria. Como no resto da tela, o
 * numero e mostrado sem veredito: alguma diferenca e normal por dominancia, e
 * quando ela deixa de ser normal e a Kelly quem sabe.
 */
function Assimetria({
  deste,
  doOutro,
}: {
  deste: number | null;
  doOutro: number | null;
}) {
  if (deste === null || doOutro === null) return null;

  const diferenca = Math.round(Math.abs(Number(deste) - Number(doOutro)) * 10) / 10;
  if (diferenca < 1) return null;

  return (
    <span className="mt-0.5 block text-[10px] text-amber-400">
      {formataNumero(diferenca)} cm de diferença entre os lados
    </span>
  );
}

/**
 * Quanto mudou da avaliacao anterior para a mais recente. Mostramos o numero
 * sem dizer se e bom ou ruim: perder cintura e ganhar biceps sao os dois
 * progresso, e so a Kelly sabe qual era a meta daquele aluno.
 */
function Diferenca({ valores }: { valores: (number | null)[] }) {
  const atual = valores[0];
  const anterior = valores.slice(1).find((v) => v !== null);

  if (atual === null || anterior === undefined || anterior === null) return null;

  const delta = Math.round((Number(atual) - Number(anterior)) * 10) / 10;
  if (delta === 0) return null;

  return (
    <span className="ml-1.5 text-[10px] text-fumaca">
      {delta > 0 ? "+" : "−"}
      {formataNumero(Math.abs(delta))}
    </span>
  );
}
