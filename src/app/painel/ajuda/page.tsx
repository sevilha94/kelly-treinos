import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Ajuda — Kelly Jhuly",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-10">
      <header>
        <span className="block text-[11px] uppercase tracking-[0.28em] text-fumaca">
          Guia do sistema
        </span>
        <h1 className="titulo-marca mt-2 text-4xl leading-none">
          Como mexer no <span className="text-sangue">seu sistema</span>
        </h1>
        <p className="mt-4 text-fumaca">
          Tudo o que dá para fazer, na ordem em que faz sentido fazer. Esta
          página fica sempre aqui no menu — dá para consultar no meio de um
          atendimento.
        </p>
      </header>

      <Indice />

      <section className="space-y-4">
        <h2 className="titulo-marca text-2xl">O caminho, na ordem</h2>
        <p className="text-sm text-fumaca">
          Estes seis passos são uma sequência de verdade: cada um depende do
          anterior. Faça uma vez, com um aluno só, e o resto vira repetição.
        </p>

        <Passo numero={1} id="entrar" titulo="Entrar no sistema">
          <p>
            Você entra com o seu e-mail e a senha combinada com o Lucas. Em cima
            ficam as áreas do sistema: <B>Alunos</B>, <B>Exercícios</B> e{" "}
            <B>Ajuda</B>. Clicando no seu logo, você volta para o painel.
          </p>
          <Nota titulo="Guarde no celular">
            Abra o sistema pelo celular e escolha “Adicionar à tela de início”.
            Passa a abrir pelo seu ícone, como um aplicativo.
          </Nota>
        </Passo>

        <Passo numero={2} id="biblioteca" titulo="Montar a biblioteca de exercícios">
          <p>
            Esta é a parte que dá trabalho — e é feita <strong>uma vez só</strong>.
            Cada exercício cadastrado aqui serve para todos os alunos, hoje e
            daqui a cinco anos.
          </p>
          <p>
            Na primeira vez, a tela oferece o botão{" "}
            <B>Preencher com exercícios comuns</B>. Ele cadastra de uma vez cerca
            de 130 exercícios de academia, já com nome e grupo muscular. Eles
            entram sem vídeo — o vídeo é você quem escolhe.
          </p>
          <p>
            Depois aparece um aviso do tipo “130 de 134 estão sem demonstração”,
            com o atalho <B>Ver só esses</B>. Essa é a sua lista de trabalho.
          </p>
          <Rotulo>Para cada exercício</Rotulo>
          <Lista
            itens={[
              <>Clique no exercício da lista.</>,
              <>
                Clique em <B>Procurar no YouTube</B> — a busca já abre com o nome
                dele.
              </>,
              <>
                Escolha um vídeo em que a execução esteja certa, copie o endereço
                e cole no campo <B>Link da demonstração</B>.
              </>,
              <>
                A <strong>prévia aparece logo abaixo</strong>. Confira se abriu o
                vídeo certo antes de salvar.
              </>,
              <>
                Escreva a <B>Dica de execução</B> — é o que o aluno lê embaixo do
                vídeo. Aqui é onde você aparece.
              </>,
            ]}
          />
          <Nota titulo="Comece pequeno">
            Não tente preencher os 130 de uma vez. Faça os 20 ou 30 que você
            realmente usa e vá completando conforme precisar.
          </Nota>
          <p className="text-sm text-fumaca">
            Serve link de vídeo do YouTube, imagem ou GIF. Dá para começar com uma
            imagem hoje e trocar por vídeo depois — inclusive por vídeos gravados
            por você, que é o que ninguém mais vai ter.
          </p>
        </Passo>

        <Passo numero={3} id="aluno" titulo="Cadastrar um aluno">
          <p>
            Em <B>Alunos</B>, clique em <B>Novo aluno</B>. Só o nome é
            obrigatório; o resto você preenche quando tiver.
          </p>
          <p>
            Use <strong>Observações</strong> para o que muda a prescrição: lesões,
            limitações, cirurgias. Fica sempre à mão quando você for montar ou
            ajustar o treino.
          </p>
          <p className="text-sm text-fumaca">
            Ao salvar, os treinos A, B, C e D já nascem criados e vazios, prontos
            para você preencher.
          </p>
        </Passo>

        <Passo numero={4} id="planilha" titulo="Montar a planilha dele">
          <p>
            Dentro do aluno, cada treino tem um bloco próprio. Em cada um você
            define a <strong>letra</strong> e o <strong>nome</strong> (por
            exemplo, A e “Peito e ombro”) e clica em <B>Salvar</B>.
          </p>
          <Rotulo>Colocar exercícios</Rotulo>
          <Lista
            itens={[
              <>
                No rodapé do bloco, escolha o exercício na lista, ajuste séries e
                repetições e clique em <B>Adicionar</B>.
              </>,
              <>Para mudar algo depois, clique em cima do exercício e ele se abre.</>,
              <>
                Use <B>↑ subir</B> e <B>↓ descer</B> para deixar na ordem em que
                ele vai executar.
              </>,
            ]}
          />
          <Rotulo>Nome só nesta planilha</Rotulo>
          <p>
            Ao abrir um exercício existe o campo{" "}
            <strong>“Nome só nesta planilha”</strong>. Serve para renomear o
            exercício <em>para aquele aluno</em>, sem mexer na biblioteca.
            Deixando em branco, volta a valer o nome original.
          </p>
          <Nota titulo="Atalho que economiza horas">
            Se o treino for parecido com o de outro aluno, use{" "}
            <B>Copiar planilha de outro aluno</B>. Vem tudo — exercícios, séries
            e repetições — e você ajusta só as diferenças.
          </Nota>
        </Passo>

        <Passo numero={5} id="semana" titulo="Definir a semana">
          <p>
            No bloco <B>Semana</B>, diga qual treino cai em cada dia. Dia sem
            treino fica em <strong>Descanso</strong>. Clique em{" "}
            <B>Salvar semana</B>.
          </p>
          <p>
            Isso faz o aluno abrir o link e já cair no treino do dia, sem
            procurar.
          </p>
        </Passo>

        <Passo numero={6} id="enviar" titulo="Enviar o link">
          <p>
            No topo da página do aluno está o <B>Link do aluno</B>. Use{" "}
            <B>Enviar no WhatsApp</B> — a mensagem já vai escrita com o nome dele.
          </p>
          <p>
            Ele não precisa de senha nem de instalar nada. E o link{" "}
            <strong>nunca muda</strong>: se você editar o treino amanhã, ele já vê
            a versão nova sem você mandar nada de novo.
          </p>
          <p className="text-sm text-fumaca">
            Vale pedir para ele adicionar à tela de início do celular. Passa a
            abrir com o seu logo, em tela cheia.
          </p>
        </Passo>
      </section>

      <section className="space-y-4">
        <h2 className="titulo-marca text-2xl">Consulta</h2>
        <p className="text-sm text-fumaca">
          Estas partes você usa conforme a necessidade — não têm ordem.
        </p>

        <Ficha id="aluno-ve" titulo="O que o aluno vê">
          <p>Vale conhecer bem, porque é o que ele vai te perguntar.</p>
          <Lista
            itens={[
              <>As letras dos treinos no topo. A do dia vem marcada com um ponto.</>,
              <>
                A lista de exercícios com séries, repetições e a última carga que
                ele usou.
              </>,
              <>
                Tocando em um exercício: o vídeo, a sua dica, a observação e um
                gráfico da evolução de carga dele naquele exercício.
              </>,
              <>
                O campo de carga e o botão <B>Fiz este</B>.
              </>,
              <>
                <B>Finalizar treino de hoje</B> no fim — é o que faz contar como
                treino feito.
              </>,
              <>
                <B>Minhas medidas</B>, se você já tiver feito avaliação física.
              </>,
            ]}
          />
          <Nota titulo="Combine isso com ele">
            O sistema só sabe que ele treinou se ele apertar “Finalizar treino”.
            Quem treina sem marcar aparece para você como sumido.
          </Nota>
        </Ficha>

        <Ficha id="acompanhar" titulo="Acompanhar quem treina">
          <p>
            O painel abre com o cartão <B>Quem sumiu</B>, mostrando só quem passou
            de 7 dias sem treinar. Os que estão em dia ficam guardados atrás de
            “ver os outros”.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-fumaca">Até 7 dias</span>
              <span>Normal, não precisa fazer nada.</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-amber-400">8 a 14 dias</span>
              <span>Vale mandar uma mensagem.</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-sangue-claro">15 dias ou mais</span>
              <span>Risco real de perder o aluno.</span>
            </li>
          </ul>
          <p className="text-sm text-fumaca">
            Debaixo de cada nome aparece quantos treinos ele fez nos últimos 30
            dias — bom para diferenciar quem sumiu agora de quem nunca foi
            constante.
          </p>
        </Ficha>

        <Ficha id="avaliacao" titulo="Avaliação física">
          <p>
            No bloco <B>Avaliação física</B> do aluno, use <B>Nova avaliação</B> e
            preencha o que mediu. O que ficar em branco simplesmente não aparece.
          </p>
          <p>
            As avaliações ficam lado a lado, da mais recente para a mais antiga, e
            cada medida mostra <strong>quanto mudou</strong> desde a anterior. O
            IMC é calculado sozinho a partir do peso e da altura.
          </p>
          <Nota titulo="Por que não diz se melhorou">
            O sistema mostra a diferença, mas não julga. Perder cintura e ganhar
            bíceps são os dois progresso, e só você sabe qual era a meta daquele
            aluno.
          </Nota>
        </Ficha>

        <Ficha id="mensalidade" titulo="Mensalidade">
          <p>
            Em <B>Valor e vencimento</B>, defina quanto ele paga e em que dia
            vence. Depois é só clicar em <B>Lançar a mensalidade</B> do mês e,
            quando o Pix cair, em <B>Marcar paga</B>.
          </p>
          <p>
            Quem estiver atrasado aparece no painel, do mais atrasado para o
            menos. O aluno vê um aviso discreto só depois do vencimento.
          </p>
          <Nota titulo="O sistema não recebe dinheiro">
            Você continua cobrando por Pix como sempre fez. Aqui é só o controle,
            para você parar de guardar isso de cabeça.
          </Nota>
          <p className="text-sm text-fumaca">
            Existe a opção de pausar o treino sozinho quando atrasa, mas ela vem{" "}
            <strong>desligada</strong> de propósito: se você esquecer de marcar um
            pagamento que entrou, o aluno perde o treino sem ter feito nada
            errado.
          </p>
        </Ficha>

        <Ficha id="acesso" titulo="Controlar o acesso">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Pausar acesso</dt>
              <dd className="text-fumaca">
                O aluno vê um aviso no lugar do treino e o link continua o mesmo.
                Para situação temporária: é só liberar que volta.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Gerar novo link</dt>
              <dd className="text-fumaca">
                O link antigo morre na hora e para sempre. Use quando desconfiar
                que ele repassou o link.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Arquivar aluno</dt>
              <dd className="text-fumaca">
                Tira o aluno da sua lista. Use quando ele encerrar de vez.
              </dd>
            </div>
          </dl>
          <p>
            Ainda no bloco do link aparece quantos{" "}
            <strong>aparelhos diferentes</strong> abriram aquele endereço. A
            partir de três, o sistema sinaliza.
          </p>
          <Nota titulo="Indício, não prova">
            Trocar de celular ou limpar o navegador também conta como aparelho
            novo. Sirva-se disso para investigar, nunca para acusar.
          </Nota>
        </Ficha>

        <Ficha id="duvidas" titulo="Perguntas comuns">
          <Pergunta pergunta="Apaguei sem querer. Perdi?">
            Não. Nada é apagado de verdade no sistema — fica arquivado. Fale com o
            Lucas e dá para recuperar.
          </Pergunta>
          <Pergunta pergunta="Mudei o treino. Preciso avisar o aluno?">
            Não. O link é o mesmo e sempre mostra a versão atual. Ele vê na
            próxima vez que abrir.
          </Pergunta>
          <Pergunta pergunta="Posso mudar o nome de um exercício?">
            Pode, sempre. Na biblioteca, muda para todos os alunos. Dentro da
            planilha, no campo “nome só nesta planilha”, muda só para aquele
            aluno.
          </Pergunta>
          <Pergunta pergunta="O aluno disse que o vídeo não abre.">
            Provavelmente o canal tirou o vídeo do ar. Entre no exercício e cole
            outro link.
          </Pergunta>
          <Pergunta pergunta="Alguém mais pode ver a planilha do meu aluno?">
            Só quem tiver o link exato dele. Ele não aparece no Google e não dá
            para adivinhar.
          </Pergunta>
        </Ficha>
      </section>

      <p className="border-t border-borda pt-6 text-sm text-fumaca">
        Qualquer coisa que travar ou que você queira diferente, fale com o Lucas —
        o sistema é seu e dá para mudar.
      </p>
    </div>
  );
}

function Indice() {
  const comeco = [
    ["entrar", "Entrar no sistema"],
    ["biblioteca", "Montar a biblioteca de exercícios"],
    ["aluno", "Cadastrar um aluno"],
    ["planilha", "Montar a planilha dele"],
    ["semana", "Definir a semana"],
    ["enviar", "Enviar o link"],
  ];
  const consulta = [
    ["aluno-ve", "O que o aluno vê"],
    ["acompanhar", "Acompanhar quem treina"],
    ["avaliacao", "Avaliação física"],
    ["mensalidade", "Mensalidade"],
    ["acesso", "Controlar o acesso"],
    ["duvidas", "Perguntas comuns"],
  ];

  return (
    <nav className="rounded-2xl border border-borda bg-carvao p-5">
      <Rotulo>Começando do zero</Rotulo>
      <ol className="mt-2 mb-5">
        {comeco.map(([id, titulo], indice) => (
          <li key={id}>
            <Link
              href={`#${id}`}
              className="flex gap-3 py-1.5 hover:text-sangue-claro"
            >
              <span className="w-5 shrink-0 font-semibold tabular-nums text-sangue">
                {indice + 1}
              </span>
              {titulo}
            </Link>
          </li>
        ))}
      </ol>

      <Rotulo>Consulta, depois que estiver rodando</Rotulo>
      <ul className="mt-2">
        {consulta.map(([id, titulo]) => (
          <li key={id}>
            <Link
              href={`#${id}`}
              className="block py-1.5 pl-8 hover:text-sangue-claro"
            >
              {titulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Passo({
  numero,
  id,
  titulo,
  children,
}: {
  numero: number;
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className="scroll-mt-4 space-y-3 rounded-2xl border border-borda bg-carvao p-5"
    >
      <div className="flex items-baseline gap-3">
        <span className="titulo-marca text-2xl leading-none text-sangue tabular-nums">
          {numero}
        </span>
        <h3 className="text-lg font-semibold">{titulo}</h3>
      </div>
      {children}
    </article>
  );
}

function Ficha({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className="scroll-mt-4 space-y-3 rounded-2xl border border-borda bg-carvao p-5"
    >
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {children}
    </article>
  );
}

/** Nome de botao exatamente como aparece na tela, para ela achar com o olho. */
function B({ children }: { children: ReactNode }) {
  return (
    <b className="rounded bg-sangue-escuro/25 px-1.5 py-0.5 font-semibold text-sangue-claro">
      {children}
    </b>
  );
}

function Rotulo({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[10px] uppercase tracking-[0.22em] text-fumaca">
      {children}
    </span>
  );
}

function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {itens.map((item, indice) => (
        <li key={indice} className="relative pl-4">
          <span
            aria-hidden
            className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-sangue"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Nota({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-l-2 border-sangue bg-sangue-escuro/10 px-3 py-2.5 text-sm">
      <span className="block text-[10px] uppercase tracking-[0.22em] text-sangue-claro">
        {titulo}
      </span>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function Pergunta({
  pergunta,
  children,
}: {
  pergunta: string;
  children: ReactNode;
}) {
  return (
    <div className="text-sm">
      <p className="font-semibold">{pergunta}</p>
      <p className="text-fumaca">{children}</p>
    </div>
  );
}
