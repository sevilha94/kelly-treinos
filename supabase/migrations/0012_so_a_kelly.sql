-- So a conta da Kelly le e escreve.
--
-- As policies antigas eram "to authenticated using (true)": qualquer conta
-- logada valia como a Kelly. Com o "Allow new users to sign up" ligado (vem
-- ligado de fabrica), qualquer pessoa criava conta e lia avaliacao, telefone e
-- tokens dos alunos, e podia trocar a chave Pix que o aluno ve na cobranca.
--
-- O UID abaixo e o da conta dela (Authentication > Users). E o mesmo valor do
-- KELLY_USER_ID na Vercel: trocar de conta exige mudar os dois.
-- O cron e o aluno usam a chave secreta, que ignora o RLS: nada muda para eles.

create or replace function eh_a_kelly() returns boolean
language sql stable
set search_path = ''
as $$ select auth.uid() = '3ee4eea4-55bc-41bd-828e-5b60635ed7c7'::uuid $$;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'exercicio', 'aluno', 'treino', 'treino_exercicio', 'aluno_agenda',
    'sessao', 'sessao_item', 'aluno_acesso', 'avaliacao', 'mensalidade',
    'aluno_lembrete', 'configuracao'
  ] loop
    execute format('drop policy "kelly le e escreve" on %I', tabela);
    execute format(
      'create policy "so a kelly" on %I for all to authenticated using (eh_a_kelly()) with check (eh_a_kelly())',
      tabela
    );
  end loop;
end $$;
