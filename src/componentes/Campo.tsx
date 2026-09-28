type Props = {
  label: string;
  nome: string;
  tipo?: string;
  valor?: string | number;
  placeholder?: string;
  obrigatorio?: boolean;
  ajuda?: string;
  multilinha?: boolean;
  opcoes?: readonly string[];
  /** Qual teclado o celular abre. Sem isso, ela digita numero com as letras. */
  modo?: "numeric" | "decimal" | "tel";
  autoCompletar?: string;
};

// 16px (text-base): abaixo disso o iPhone da zoom a cada toque no campo.
// Borda e placeholder em fumaca: a cor "borda" some sobre o grafite (1.18:1)
export const CLASSE_ENTRADA =
  "w-full rounded-lg border border-fumaca/70 bg-grafite px-3 py-2.5 text-base text-gelo placeholder:text-fumaca focus:border-sangue focus:outline-none";

export function Campo({
  label,
  nome,
  tipo = "text",
  valor,
  placeholder,
  obrigatorio,
  ajuda,
  multilinha,
  opcoes,
  modo,
  autoCompletar,
}: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-fumaca">
        {label}
      </span>

      {opcoes ? (
        <select
          name={nome}
          defaultValue={valor ?? ""}
          required={obrigatorio}
          className={CLASSE_ENTRADA}
        >
          <option value="">Selecione...</option>
          {opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      ) : multilinha ? (
        <textarea
          name={nome}
          defaultValue={valor}
          placeholder={placeholder}
          required={obrigatorio}
          rows={3}
          className={CLASSE_ENTRADA}
        />
      ) : (
        <input
          name={nome}
          type={tipo}
          inputMode={modo}
          autoComplete={autoCompletar}
          defaultValue={valor}
          placeholder={placeholder}
          required={obrigatorio}
          className={CLASSE_ENTRADA}
        />
      )}

      {ajuda && <span className="mt-1 block text-xs text-fumaca">{ajuda}</span>}
    </label>
  );
}
