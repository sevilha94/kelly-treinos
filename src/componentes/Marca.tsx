import Image from "next/image";

/**
 * O logo e uma arte unica com fundo preto solido (0,0,0) e sem transparencia.
 *
 * Em vez de recortar o arquivo — o que deixaria serrilhado em volta do brilho
 * vermelho —, usamos mix-blend-mode: screen. Sobre qualquer fundo escuro, o
 * preto puro resulta exatamente na cor do fundo, entao o quadrado desaparece e
 * o brilho continua intacto. So funciona porque o sistema inteiro e escuro.
 *
 * Na versao compacta mostramos so o kettlebell, sem o nome da arte — ele
 * ficaria ilegivel em 40px, e o nome ja aparece escrito ao lado. Medindo o
 * arquivo: o simbolo termina no pixel 603 e o texto comeca no 630, entao a
 * largura de 44px faz a caixa de 40px cortar em 610, no vao entre os dois.
 */
export function Marca({ compacta = false }: { compacta?: boolean }) {
  if (compacta) {
    return (
      <span className="flex items-center gap-2.5">
        <span className="relative block h-10 w-10 shrink-0 overflow-hidden">
          <Image
            src="/logo.png"
            alt=""
            width={671}
            height={765}
            priority
            className="absolute left-1/2 top-0 h-auto w-11 max-w-none -translate-x-1/2 mix-blend-screen"
          />
        </span>
        <span className="titulo-marca text-xl leading-none text-gelo">
          Kelly Jhuly
        </span>
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Kelly Jhuly — Personal trainer"
      width={671}
      height={765}
      priority
      className="h-auto w-48 mix-blend-screen"
    />
  );
}
