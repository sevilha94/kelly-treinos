import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajuda — Kelly Jhuly",
};

export default async function Page() {
  // os numeros saem do banco: escritos na mao, envelheceriam no primeiro
  // exercicio que ela cadastrasse
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercicio")
    .select("midia_url")
    .is("arquivado_em", null);

  const total = data?.length ?? 0;
  const semMidia = (data ?? []).filter((ex) => !ex.midia_url?.trim()).length;

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

        <Passo numero={2} id="biblioteca" titulo="Completar a biblioteca de exercícios">
          <p>
            Sua biblioteca tem hoje{" "}
            <strong>
              {total} {total === 1 ? "exercício" : "exercícios"}
            </strong>
            , separados por grupo muscular.{" "}
            {semMidia > 0 ? (
              <>
                Desses, <strong>{semMidia}</strong> ainda estão sem vídeo — e é
                aí que você entra.
              </>
            ) : (
              <>Todos já têm demonstração. Essa parte está feita.</>
            )}
          </p>
          <p>
            Esta é a parte que dá trabalho, e é feita <strong>uma vez só</strong>
            . Cada exercício serve para todos os alunos, hoje e daqui a cinco
            anos.
          </p>
          <Rotulo>Achar o exercício</Rotulo>
          <p>
            Os grupos vêm fechados, com a quantidade ao lado do nome. Clique em{" "}
            <B>Peito</B>, <B>Pernas</B> ou qualquer outro e ele abre; clique de
            novo e fecha. A setinha à esquerda gira para mostrar o que está
            aberto.
          </p>
          <p>
            {semMidia > 0 ? (
              <>
                No topo aparece o aviso “{semMidia} de {total} estão sem
                demonstração”, com o atalho <B>Ver só esses</B>. Essa é a sua
                lista de trabalho: com o filtro ligado, os grupos já vêm abertos.
              </>
            ) : (
              <>
                Quando algum exercício estiver sem vídeo, aparece um aviso no
                topo com o atalho <B>Ver só esses</B> — sua lista de trabalho.
              </>
            )}
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
                e cole no campo <B>Link da demonstração</B>. Ou, se preferir usar
                um vídeo seu, veja logo abaixo.
              </>,
              <>
                A <strong>prévia aparece logo abaixo</strong>. Confira se abriu o
                vídeo certo antes de salvar.
              </>,
              <>
                Escreva a <B>Dica de execução</B> — é o que o aluno lê embaixo do
                vídeo. Aqui é onde você aparece.
              </>,
              <>
                Ao salvar, a tela volta para a lista já aberta no grupo daquele
                exercício, para você continuar de onde parou.
              </>,
            ]}
          />
          <Rotulo>Usar um vídeo gravado por você</Rotulo>
          <p className="text-sm text-fumaca">
            É o que ninguém mais vai ter: a execução do seu jeito, com a sua
            correção. Dentro do exercício, embaixo do campo de link, tem o botão{" "}
            <B>Enviar um vídeo do celular</B>.
          </p>
          <Lista
            itens={[
              <>
                Grave o exercício de <strong>10 a 15 segundos</strong>, na
                horizontal, mostrando o movimento inteiro — subida e descida.
              </>,
              <>
                Toque em <B>Enviar um vídeo do celular</B> e escolha o vídeo na
                galeria.
              </>,
              <>
                Aparece uma barra com o quanto já subiu.{" "}
                <strong>Não feche a tela até terminar.</strong> Se estiver fora
                do Wi-Fi e demorar, dá para cancelar e refazer depois.
              </>,
              <>
                Quando terminar, o vídeo aparece na prévia. Confira e clique em{" "}
                <B>Salvar</B> — é o Salvar que prende o vídeo no exercício.
              </>,
            ]}
          />
          <Nota titulo="Se você grava no iPhone">
            Entre em <B>Ajustes › Câmera › Formatos</B> e deixe em{" "}
            <B>Mais Compatível</B>. No outro formato, o vídeo abre no seu iPhone
            mas pode ficar preto no celular Android de alguns alunos — e você não
            veria isso na prévia, porque no seu aparelho funciona.
          </Nota>
          <Nota titulo="Comece pequeno">
            Não tente preencher tudo de uma vez. Faça os 20 ou 30 que você
            realmente usa e vá completando conforme precisar — exercício sem
            vídeo continua funcionando na planilha, só não tem demonstração.
          </Nota>
          <Nota titulo="Os vídeos abrem sem som">
            O aluno está na academia, no meio do barulho ou de fone. Todo vídeo
            começa mudo — o que importa é ver o movimento. Se ele quiser ouvir, é
            só ligar o som no próprio vídeo. Por isso, ao escolher, olhe se a
            execução se entende <strong>só de assistir</strong>: vídeo que
            depende da explicação falada não serve bem aqui.
          </Nota>
          <p className="text-sm text-fumaca">
            Serve link de vídeo do YouTube, imagem ou GIF. Dá para começar com uma
            imagem hoje e trocar por vídeo depois — inclusive por vídeos gravados
            por você, que é o que ninguém mais vai ter.
          </p>
          <p className="text-sm text-fumaca">
            Faltou algum exercício que você usa? Use <B>Novo exercício</B> e
            cadastre do seu jeito — ele entra sozinho no grupo muscular certo.
          </p>
          <Rotulo>Tirar um exercício da lista</Rotulo>
          <p className="text-sm text-fumaca">
            Sobrou exercício que você não usa? Abra ele e clique em{" "}
            <B>Excluir exercício</B>, no fim da tela. Ele some da biblioteca e da
            lista de montar planilha, e a sua lista fica só com o que interessa.
          </p>
          <Nota titulo="Excluir aqui não estraga planilha de aluno">
            Quem já tem esse exercício na planilha continua vendo tudo normal —
            nome, vídeo e dica. O que muda é só a sua lista.
          </Nota>
          <p className="text-sm text-fumaca">
            Excluiu sem querer? No fim da página da biblioteca aparece{" "}
            <B>Exercícios excluídos</B>. Abra e clique em <B>Trazer de volta</B>.
            Nada é apagado de verdade.
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
                No rodapé do bloco, escolha primeiro o <B>Grupo</B> — “Pernas”,
                “Costas”, o que for. A lista de exercícios encolhe só para
                aquele grupo, em vez de mostrar os {total} de uma vez.
              </>,
              <>
                Escolha o exercício, ajuste séries e repetições e clique em{" "}
                <B>Adicionar</B>. Deixando o grupo em “Todos”, a lista continua
                separada por grupo mesmo assim.
              </>,
              <>Para mudar algo depois, clique em cima do exercício e ele se abre.</>,
              <>
                Preencha o <B>Descanso (segundos)</B> e o aluno ganha um
                cronômetro naquele exercício, para não ficar olhando o relógio
                entre as séries. Ele tem um anel que vai esvaziando, para o
                aluno ver quanto falta de relance, sem precisar ler.
              </>,
            ]}
          />
          <Rotulo>Mudar a ordem dos exercícios</Rotulo>
          <p className="text-sm text-fumaca">
            Montou e quer trocar dois de lugar? Não precisa apagar nada nem
            remontar o treino.
          </p>
          <Lista
            itens={[
              <>
                <strong>Clique em cima do exercício</strong> que você quer mover.
                Ele se abre — é aqui que quase todo mundo trava, porque fechado
                ele não mostra os botões.
              </>,
              <>
                Na linha de baixo, ao lado de <B>Salvar</B>, aparecem{" "}
                <B>↑ subir</B> e <B>↓ descer</B>. Cada clique anda uma posição.
              </>,
              <>
                Clique quantas vezes precisar. O primeiro da lista não mostra{" "}
                <B>↑ subir</B> e o último não mostra <B>↓ descer</B>, porque não
                teriam para onde ir.
              </>,
            ]}
          />
          <Nota titulo="A ordem é a ordem do treino">
            É nessa sequência que o aluno vê no celular dele, numerada 01, 02,
            03. Então ela vale como orientação de execução: o que estiver em
            primeiro é o que você quer que ele faça primeiro.
          </Nota>
          <Nota titulo="Não existe “salvar tudo”">
            Cada botão salva na hora que você clica — o de <B>Adicionar</B>, o{" "}
            <B>Salvar</B> de cada treino, o de dentro de cada exercício. Enquanto
            salva, o botão mostra “Salvando...” e fica travado, para não salvar
            duas vezes sem querer. Pode fechar a página quando quiser que nada se
            perde.
          </Nota>
          <Nota titulo="O que não tem volta, pergunta antes">
            Cinco ações abrem uma pergunta de confirmação: gerar novo link,
            excluir treino, excluir exercício, apagar avaliação e
            arquivar aluno. O resto salva direto — se perguntasse em tudo, você
            aprenderia a clicar em “ok” sem ler, e aí a pergunta não protegeria
            mais nada.
          </Nota>
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
                Uma barra fina no topo que avança a cada exercício marcado. Ela
                só aparece depois do primeiro — serve para ele sentir que está
                chegando ao fim.
              </>,
              <>
                <B>Finalizar treino de hoje</B> no fim — é o que faz contar como
                treino feito. Depois de tocar, o botão vira o aviso{" "}
                <strong>“Treino concluído”</strong> com a hora, e ele pode
                desfazer se tocou sem querer.
              </>,
              <>
                Depois de finalizar, ele diz como foi:{" "}
                <B>fácil</B>, <B>na medida</B> ou <B>puxado</B>, com um
                comentário opcional. Você lê isso no histórico dele.
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
            Logo abaixo dos números, o painel mostra o cartão <B>Quem sumiu</B>{" "}
            com quem passou de 7 dias sem treinar. Os que estão em dia ficam
            guardados atrás de “ver os outros”.
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

        <Ficha id="lembretes" titulo="Lembrete no celular do aluno">
          <p>
            No painel, em <B>Lembrete no celular dos alunos</B>, você escolhe um
            horário. Todo dia, a partir desse horário, quem tem treino marcado na
            agenda recebe um aviso no celular — e quem já treinou naquele dia não
            é incomodado. Sai uma vez por dia só.
          </p>
          <Nota titulo="“A partir de”, e não “em ponto”">
            O horário é a hora mais cedo em que o aviso pode sair, não um
            despertador cravado. Se o servidor estiver ocupado naquele minuto, o
            lembrete sai um pouco depois em vez de não sair. Atrasado ainda
            serve; não existir, não.
          </Nota>
          <p>
            Do lado do aluno, aparece no link dele a pergunta “Quer um lembrete
            no dia do seu treino?”. Ele toca em <B>Quero</B> e o celular pede a
            permissão. Só recebe quem aceitar.
          </p>
          <Rotulo>O que a mensagem diz</Rotulo>
          <Lista
            itens={[
              <>
                Quem está na rotina recebe o treino do dia: “Hoje é treino C —
                costas e abdômen”. Ele já sabe se vai dar tempo e o que levar.
              </>,
              <>
                Quem passou de 7 dias sem treinar recebe outra coisa: “Seu
                último treino foi há 9 dias. Bora voltar?”. Para quem sumiu, a
                letra do dia não interessa — o assunto é voltar.
              </>,
              <>
                Dia de descanso não gera lembrete, e quem já treinou naquele dia
                também não recebe.
              </>,
            ]}
          />
          <Nota titulo="Por que não cobramos treino perdido">
            O sistema nunca diz “você faltou terça”. Aluno que já se sente mal
            por ter faltado, recebendo cobrança, desinstala em vez de treinar. A
            falta você vê no painel e decide o que fazer — que é onde essa
            decisão deve estar.
          </Nota>
          <Nota titulo="Avise seus alunos de iPhone">
            No Android funciona direto. No iPhone, ele precisa antes adicionar o
            treino à tela de início — é uma exigência da Apple, não do sistema.
            Sem isso, o botão avisa que aquele navegador não aceita lembretes.
          </Nota>
          <p className="text-sm text-fumaca">
            Não usa WhatsApp e não tem custo: é o próprio celular dele que avisa.
          </p>
        </Ficha>

        <Ficha id="historico" titulo="Histórico de um aluno">
          <p>
            Dentro do aluno, o botão <B>Ver histórico</B> abre três coisas que
            ajudam a decidir o próximo passo dele.
          </p>
          <Lista
            itens={[
              <>
                <strong>Treinos por semana</strong> nas últimas oito semanas —
                mostra se a constância caiu antes de ele sumir de vez.
              </>,
              <>
                <strong>Evolução de carga</strong>, exercício por exercício, do
                primeiro registro até o último. Quem mais evoluiu aparece em
                cima; quem está parado há semanas fica evidente lá embaixo.
              </>,
              <>
                <strong>Como ele avaliou os treinos</strong> — fácil, na medida
                ou puxado, com os comentários que ele escreveu.
              </>,
            ]}
          />
          <Nota titulo="Onde isso vira decisão">
            Carga parada há seis semanas com “fácil” em todos os treinos é o
            momento de mudar o estímulo. Esse cruzamento é o que justifica o
            acompanhamento.
          </Nota>
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
          <Rotulo>Medidas dos dois lados</Rotulo>
          <p>
            Bíceps, quadríceps e panturrilha têm campo para o lado{" "}
            <strong>direito e esquerdo</strong>. Quando a diferença entre eles
            passa de 1 cm, a tela avisa embaixo do nome da medida — abaixo disso
            é variação de fita métrica, não assimetria.
          </p>
          <p className="text-sm text-fumaca">
            O aviso é só um número, sem julgamento: alguma diferença é normal
            por dominância. Quando ela deixa de ser normal, quem sabe é você.
          </p>
          <Nota titulo="Por que não diz se melhorou">
            O sistema mostra a diferença, mas não julga. Perder cintura e ganhar
            bíceps são os dois progresso, e só você sabe qual era a meta daquele
            aluno.
          </Nota>
        </Ficha>

        <Ficha id="mensalidade" titulo="Mensalidade">
          <p>
            O valor e o dia do vencimento você preenche uma vez, no{" "}
            <B>cadastro do aluno</B>. <strong>Depois disso é automático:</strong>{" "}
            o sistema lança a mensalidade de cada mês sozinho, 5 dias antes de
            vencer. Você não precisa fazer nada todo mês.
          </p>
          <p className="text-sm text-fumaca">
            Existe um botão para lançar na hora, dentro do aluno, mas é só para
            adiantar ou para acertar o primeiro mês.
          </p>
          <Nota titulo="Preencha sua chave Pix primeiro">
            No painel, em <B>Chave Pix para receber</B>, coloque a chave e o seu
            nome. É o que o aluno vê na hora de pagar — sem isso ele não tem
            para onde mandar o dinheiro. Ele copia a chave com um toque, o que
            evita o erro mais comum: digitar errado e pagar para um estranho.
          </Nota>
          <Rotulo>O aluno avisa que pagou</Rotulo>
          <p>
            A cobrança aparece no link dele <strong>5 dias antes de vencer</strong>,
            com o botão <B>Já paguei — enviar comprovante</B>. Ele anexa o print
            do Pix ali mesmo. Você vê <B>Ver comprovante</B> no painel, confere e
            clica em <B>Marcar paga</B>.
          </p>
          <p className="text-sm text-fumaca">
            Assim que ele envia, a cobrança some da tela dele e só volta no mês
            seguinte. Quem está em dia abre o aplicativo para treinar, não para
            ser lembrado de dinheiro.
          </p>
          <Rotulo>Você fica sabendo na hora</Rotulo>
          <p>
            Ligue <B>Avisos no seu celular</B> no painel e você recebe uma
            notificação assim que um aluno enviar comprovante — sem precisar
            abrir nada. No horário do lembrete você também recebe um resumo, se
            houver comprovante para conferir ou mensalidade vencida.
          </p>
          <p className="text-sm text-fumaca">
            Vale por aparelho: se usa celular e computador, ligue nos dois. E,
            como acontece com os alunos, no iPhone é preciso ter o painel na
            tela de início.
          </p>
          <Rotulo>O que acontece se ele não pagar</Rotulo>
          <ul className="space-y-2 text-sm">
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 text-amber-400">1 a 4 dias</span>
              <span>Aparece como “Atrasada” no seu painel.</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 text-sangue-claro">5 e 6 dias</span>
              <span>Vira “Atraso crítico” e sobe para o topo da lista.</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 text-sangue-claro">7 dias</span>
              <span>
                O treino dele é pausado sozinho, até enviar o comprovante ou
                você dar baixa.
              </span>
            </li>
          </ul>
          <Nota titulo="Enviar o comprovante já destrava">
            No instante em que o aluno anexa o comprovante, o treino volta —
            mesmo antes de você conferir. Ele fez a parte dele; travar por causa
            da sua fila de conferência puniria a pessoa errada.
          </Nota>
          <Nota titulo="O sistema não recebe dinheiro">
            Você continua cobrando por Pix como sempre fez. Aqui é só o controle,
            para você parar de guardar isso de cabeça.
          </Nota>
          <p className="text-sm text-fumaca">
            O bloqueio automático em 7 dias vem <strong>ligado</strong>, e dá para
            desligar por aluno em <B>Valor e vencimento</B>, junto com o número
            de dias de tolerância.
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

        <Ficha id="saude" titulo="Quando algo dá errado sozinho">
          <p>
            Existe um motor que trabalha sozinho todo dia: manda os lembretes,
            lança as mensalidades do mês e guarda a cópia de segurança. Você
            nunca precisa mexer nele.
          </p>
          <p>
            Se ele parar, <strong>aparece um aviso no topo do painel</strong> —
            em amarelo quando está só atrasado, em vermelho quando parou de
            verdade. Nesse caso, me avise: não é nada que você tenha feito de
            errado, e nada que você consiga resolver pela tela.
          </p>
          <Nota titulo="Silêncio é sinal de que está tudo bem">
            O aviso só aparece quando há problema. Se não tem faixa nenhuma no
            topo, o motor rodou. Faixa verde todo dia dizendo “tudo certo” é o
            tipo de coisa que a gente aprende a ignorar — e aí o dia que importa
            passa batido também.
          </Nota>
        </Ficha>

        <Ficha id="copia" titulo="Cópia de segurança">
          <p>
            Todo dia o sistema guarda sozinho uma cópia de tudo: seus alunos, as
            planilhas, o histórico de carga de cada um, as avaliações e as
            mensalidades. Você não precisa fazer nada para isso acontecer.
          </p>
          <p>
            No painel, em <B>Cópia de segurança</B>, aparece a data da cópia mais
            recente. É ali que você confere que está acontecendo — e o botão{" "}
            <B>Baixar</B> salva o arquivo no seu computador.
          </p>
          <Nota titulo="Baixe uma por mês e guarde">
            O sistema guarda as cópias dos últimos 30 dias. Baixar uma de vez em
            quando e deixar salva no seu computador protege contra o caso raro em
            que o problema é com o próprio sistema. É o mesmo motivo de guardar
            uma via impressa de documento importante.
          </Nota>
          <p className="text-sm text-fumaca">
            O arquivo não abre como planilha: ele serve para recolocar tudo no
            lugar se algum dia acontecer alguma coisa. Se precisar, entregue ao
            Lucas ou a quem estiver cuidando do sistema.
          </p>
        </Ficha>

        <Ficha id="duvidas" titulo="Perguntas comuns">
          <Pergunta pergunta="Cadê o botão de salvar tudo no final?">
            Não existe, e é de propósito. Cada botão salva na hora que você
            clica, então não há nada esperando para ser gravado. Enquanto salva,
            o botão mostra “Salvando...”.
          </Pergunta>
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
    ["lembretes", "Lembrete no celular do aluno"],
    ["historico", "Histórico de um aluno"],
    ["avaliacao", "Avaliação física"],
    ["mensalidade", "Mensalidade"],
    ["acesso", "Controlar o acesso"],
    ["saude", "Quando algo dá errado sozinho"],
    ["copia", "Cópia de segurança"],
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
        <span className="numero text-2xl leading-none text-sangue">
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
