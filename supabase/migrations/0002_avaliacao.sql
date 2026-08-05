-- Avaliacao fisica: as mesmas medidas da planilha impressa da Kelly, so que
-- guardadas ao longo do tempo para dar para comparar uma com a outra.
--
-- O IMC nao e guardado: sai de peso e altura, entao calcular na hora evita que
-- o numero fique divergindo do resto quando alguem corrige uma medida.

create table avaliacao (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references aluno(id),
  data date not null default current_date,

  peso_kg numeric(5,2),
  altura_cm integer,

  cintura_cm numeric(5,1),
  circunferencia_abdominal_cm numeric(5,1),
  torax_cm numeric(5,1),
  quadril_cm numeric(5,1),
  quadriceps_cm numeric(5,1),
  biceps_direito_cm numeric(5,1),
  biceps_esquerdo_cm numeric(5,1),
  panturrilha_cm numeric(5,1),

  gordura_corporal_pct numeric(4,1),
  gordura_visceral numeric(4,1),
  massa_corporal_pct numeric(4,1),

  observacoes text,
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz
);
create index idx_avaliacao_aluno on avaliacao(aluno_id, data desc)
  where arquivado_em is null;

alter table avaliacao enable row level security;
create policy "kelly le e escreve" on avaliacao for all to authenticated using (true) with check (true);
