-- Deposito dos videos que a Kelly grava.
--
-- Publico de proposito, ao contrario do balde de comprovantes: e demonstracao
-- de exercicio, o mesmo que ela poria no YouTube. Publico deixa o video ser
-- guardado pela rede de distribuicao, o que corta consumo e faz abrir rapido no
-- 4G da academia — endereco assinado expira e nao guarda em cache.
--
-- O envio nao depende de politica aqui: o servidor confere o login da Kelly e
-- so entao emite um cracha temporario para aquele arquivo, e o navegador dela
-- envia direto para o Supabase. Video nao cabe no limite de corpo da Vercel.
--
-- 50 MB da uns 30 segundos de video de celular em 1080p — de sobra para uma
-- demonstracao. Quicktime esta na lista porque iPhone grava .mov.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
