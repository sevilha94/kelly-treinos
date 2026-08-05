import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "principal" | "secundario" | "perigo";
};

const ESTILOS = {
  principal: "bg-sangue text-white hover:bg-sangue-claro",
  secundario: "border border-borda bg-grafite text-gelo hover:border-fumaca",
  perigo: "border border-sangue-escuro text-sangue-claro hover:bg-sangue-escuro/20",
};

export function Botao({
  variante = "principal",
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
    />
  );
}
