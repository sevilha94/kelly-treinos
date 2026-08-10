-- Notificacao no celular da Kelly.
--
-- Mesma tecnologia dos lembretes do aluno, mas presa ao usuario que faz login
-- em vez de a um aluno. Ela pode ter mais de um aparelho, e uma assinatura
-- morre sozinha quando ela desinstala — por isso desativar em vez de apagar.

create table painel_lembrete (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now(),
  desativado_em timestamptz
);
create index idx_painel_lembrete_usuario on painel_lembrete(usuario_id)
  where desativado_em is null;

alter table painel_lembrete enable row level security;

-- cada uma so enxerga as proprias assinaturas, caso um dia haja mais de uma
-- pessoa no painel
create policy "dono le e escreve" on painel_lembrete
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
