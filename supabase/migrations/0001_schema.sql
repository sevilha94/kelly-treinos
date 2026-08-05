-- Kelly Jhuly Personal Trainer — estrutura inicial
--
-- Duas audiencias:
--   1. a Kelly, logada (auth.users), que enxerga e edita tudo pelo /painel
--   2. o aluno, sem login, que abre /aluno/<token> e so enxerga a propria planilha
--
-- O aluno nunca fala direto com o banco: a pagina dele roda no servidor, valida o
-- token e usa a service role. Por isso as policies abaixo liberam apenas usuarios
-- autenticados — anon nao le nada.
--
-- Nada e apagado de verdade: "remover" significa preencher arquivado_em.

-- ---------------------------------------------------------------------------
-- BIBLIOTECA DE EXERCICIOS
-- Cadastrada uma vez, reaproveitada em todos os alunos.
-- ---------------------------------------------------------------------------
create table exercicio (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo_muscular text not null,
  -- link de imagem, GIF ou video do YouTube; o app detecta o tipo sozinho,
  -- entao da pra comecar com GIF e trocar por video depois sem mexer no schema
  midia_url text,
  dica text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  arquivado_em timestamptz
);
create index idx_exercicio_grupo on exercicio(grupo_muscular) where arquivado_em is null;

-- ---------------------------------------------------------------------------
-- ALUNO
-- ---------------------------------------------------------------------------
create table aluno (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  data_nascimento date,
  peso_kg numeric(5,2),
  altura_cm integer,
  objetivo text,
  data_inicio date not null default current_date,
  -- 32 caracteres aleatorios: e a "senha" do aluno, embutida na URL.
  -- Trocar este valor derruba o link antigo na hora e para sempre.
  token_link text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  -- acesso pausado pela Kelly: o link continua valido, mas o aluno so ve um aviso
  acesso_bloqueado_em timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  arquivado_em timestamptz
);
create index idx_aluno_token on aluno(token_link);

-- ---------------------------------------------------------------------------
-- TREINO (o "A", "B", "C", "D" de cada aluno)
-- ---------------------------------------------------------------------------
create table treino (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references aluno(id),
  letra text not null,
  titulo text not null,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz
);
create index idx_treino_aluno on treino(aluno_id) where arquivado_em is null;

-- ---------------------------------------------------------------------------
-- EXERCICIO DENTRO DE UM TREINO
--
-- apelido: nome so para esta planilha. Se a Kelly escrever algo aqui, e isso que
-- o aluno le no lugar do nome da biblioteca. Serve para renomear para um aluno
-- especifico sem mudar o exercicio para todo mundo.
-- ---------------------------------------------------------------------------
create table treino_exercicio (
  id uuid primary key default gen_random_uuid(),
  treino_id uuid not null references treino(id),
  exercicio_id uuid not null references exercicio(id),
  apelido text,
  series text not null default '4',
  repeticoes text not null default '12',
  observacao text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz
);
create index idx_treino_exercicio_treino on treino_exercicio(treino_id) where arquivado_em is null;

-- ---------------------------------------------------------------------------
-- AGENDA DA SEMANA (segunda = 1 ... domingo = 7)
-- Define qual treino cai em qual dia, para o aluno abrir o link e ja ver o de hoje.
-- ---------------------------------------------------------------------------
create table aluno_agenda (
  aluno_id uuid not null references aluno(id),
  dia_semana smallint not null check (dia_semana between 1 and 7),
  treino_id uuid references treino(id),
  primary key (aluno_id, dia_semana)
);

-- ---------------------------------------------------------------------------
-- EXECUCAO: o que o aluno marcou que fez
-- ---------------------------------------------------------------------------
create table sessao (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references aluno(id),
  treino_id uuid not null references treino(id),
  data date not null default current_date,
  finalizada_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (aluno_id, treino_id, data)
);
create index idx_sessao_aluno_data on sessao(aluno_id, data desc);

create table sessao_item (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references sessao(id),
  treino_exercicio_id uuid not null references treino_exercicio(id),
  feito boolean not null default false,
  carga_kg numeric(6,2),
  atualizado_em timestamptz not null default now(),
  unique (sessao_id, treino_exercicio_id)
);

-- ---------------------------------------------------------------------------
-- ACESSOS AO LINK
--
-- Serve para a Kelly perceber que um link talvez tenha sido repassado: se o
-- mesmo link aparece em muitos aparelhos, vale investigar. Nao e prova de nada
-- (trocar de celular ou limpar o navegador ja conta como aparelho novo) e por
-- isso nao guardamos IP nem nada que identifique a pessoa — so um id aleatorio
-- gravado no navegador e o modelo aproximado do aparelho.
-- ---------------------------------------------------------------------------
create table aluno_acesso (
  aluno_id uuid not null references aluno(id),
  dispositivo_id uuid not null,
  aparelho text,
  primeiro_em timestamptz not null default now(),
  ultimo_em timestamptz not null default now(),
  visitas integer not null default 1,
  primary key (aluno_id, dispositivo_id)
);
create index idx_aluno_acesso_aluno on aluno_acesso(aluno_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table exercicio enable row level security;
alter table aluno enable row level security;
alter table treino enable row level security;
alter table treino_exercicio enable row level security;
alter table aluno_agenda enable row level security;
alter table sessao enable row level security;
alter table sessao_item enable row level security;
alter table aluno_acesso enable row level security;

create policy "kelly le e escreve" on exercicio for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on aluno for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on treino for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on treino_exercicio for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on aluno_agenda for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on sessao for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on sessao_item for all to authenticated using (true) with check (true);
create policy "kelly le e escreve" on aluno_acesso for all to authenticated using (true) with check (true);
