-- Regras que estavam so no codigo passam a valer no banco.
--
-- O empate de posicao no treino travou o botao de mover por meses, sem avisar.
-- Foi corrigido no codigo, mas o banco continuava aceitando — e regra que mora
-- so no codigo volta, porque basta um caminho novo esquecer de aplica-la. Aqui
-- ela deixa de depender de alguem lembrar.
--
-- Antes de escrever isto, conferi que nenhum dado atual viola nenhuma das
-- restricoes abaixo.

-- 1. Duas posicoes iguais no mesmo treino, nunca mais.
--
-- Indice parcial: exercicio tirado do treino fica arquivado e guarda a posicao
-- antiga, entao ele nao pode disputar com os que estao em uso.
create unique index if not exists treino_exercicio_ordem_unica
  on treino_exercicio (treino_id, ordem)
  where arquivado_em is null;

-- 2. Carga que nao existe no mundo real nao entra.
--
-- Mesmo limite que a leitura do campo aplica. Ter nos dois lugares nao e
-- repeticao a toa: a leitura da a mensagem boa para o aluno, e o banco garante
-- que nenhum outro caminho — importacao, correcao na mao, codigo futuro —
-- consiga gravar um numero que estraga o grafico de evolucao dele.
alter table sessao_item
  drop constraint if exists sessao_item_carga_plausivel;
alter table sessao_item
  add constraint sessao_item_carga_plausivel
  check (carga_kg is null or (carga_kg > 0 and carga_kg <= 1000));

-- 3. Mensalidade com valor zero ou negativo e sempre engano.
alter table mensalidade
  drop constraint if exists mensalidade_valor_positivo;
alter table mensalidade
  add constraint mensalidade_valor_positivo
  check (valor > 0);

-- 4. Dia de vencimento so ate 28.
--
-- 29, 30 e 31 nao existem em todo mes: a cobranca de fevereiro nasceria com
-- data invalida. O painel ja limita, mas o banco e quem garante.
alter table aluno
  drop constraint if exists aluno_dia_vencimento_valido;
alter table aluno
  add constraint aluno_dia_vencimento_valido
  check (dia_vencimento is null or dia_vencimento between 1 and 28);

-- 5. Posicao negativa nao significa nada.
alter table treino_exercicio
  drop constraint if exists treino_exercicio_ordem_positiva;
alter table treino_exercicio
  add constraint treino_exercicio_ordem_positiva
  check (ordem >= 0);
