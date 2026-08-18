-- Onde ficam as copias de seguranca do banco.
--
-- Privado, ao contrario do balde de videos: aqui dentro vai a carteira inteira
-- de alunos — nome, telefone, peso, avaliacao fisica, valor de mensalidade. E o
-- arquivo mais sensivel do sistema. So se alcanca por endereco assinado, gerado
-- depois de o login da Kelly estar confirmado.
--
-- 20 MB cobre com folga o banco inteiro em JSON por muitos anos: hoje ele nao
-- passa de algumas centenas de kilobytes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'copias',
  'copias',
  false,
  20971520,
  array['application/json']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
