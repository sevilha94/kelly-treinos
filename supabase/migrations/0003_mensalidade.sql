-- Controle de mensalidade.
--
-- O sistema NAO movimenta dinheiro: a Kelly continua cobrando por Pix como ja
-- faz. Aqui so registramos quanto, quando vence e se entrou, para ela parar de
-- controlar isso de cabeca.

alter table aluno
  add column valor_mensalidade numeric(8,2),
  add column dia_vencimento smallint check (dia_vencimento between 1 and 28),
  -- pausar sozinho o acesso de quem atrasou. Nasce desligado de proposito: se a
  -- Kelly esquecer de marcar um Pix que entrou, o aluno perde o treino sem
  -- motivo e a culpa cai no sistema.
  add column bloquear_por_atraso boolean not null default false,
  add column dias_tolerancia smallint not null default 5;

create table mensalidade (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references aluno(id),
  -- primeiro dia do mes de referencia, para dar para comparar e agrupar
  competencia date not null,
  valor numeric(8,2) not null,
  vencimento date not null,
  pago_em timestamptz,
  forma text,
  observacoes text,
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz,
  unique (aluno_id, competencia)
);
create index idx_mensalidade_aluno on mensalidade(aluno_id, competencia desc)
  where arquivado_em is null;
create index idx_mensalidade_abertas on mensalidade(vencimento)
  where pago_em is null and arquivado_em is null;

alter table mensalidade enable row level security;
create policy "kelly le e escreve" on mensalidade for all to authenticated using (true) with check (true);
