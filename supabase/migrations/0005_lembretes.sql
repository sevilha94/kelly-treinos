-- Lembrete no celular do aluno.
--
-- O navegador de cada aparelho gera uma "assinatura": um endereco unico para
-- onde a notificacao e enviada, mais duas chaves de criptografia. Guardamos
-- isso; nao ha nada aqui que identifique a pessoa alem do vinculo com o aluno.
--
-- Um aluno pode ter varias assinaturas (celular e tablet, por exemplo), e uma
-- assinatura morre sozinha quando ele desinstala ou nega a permissao — por isso
-- o campo para desativar em vez de apagar.

create table aluno_lembrete (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references aluno(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now(),
  -- preenchido quando o servico de push avisa que aquele endereco morreu
  desativado_em timestamptz
);
create index idx_lembrete_aluno on aluno_lembrete(aluno_id)
  where desativado_em is null;

-- Ajustes gerais do sistema, em pares chave/valor: hoje so o horario do
-- lembrete, mas evita criar uma tabela nova a cada configuracao futura.
create table configuracao (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now()
);

insert into configuracao (chave, valor) values ('hora_lembrete', '7');

alter table aluno_lembrete enable row level security;
alter table configuracao enable row level security;
create policy "kelly le e escreve" on aluno_lembrete for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on configuracao for all to authenticated using (true) with check (true);
