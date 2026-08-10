-- O aluno informa o pagamento e anexa o comprovante do Pix.
--
-- Muda quem se protege: antes o bloqueio automatico dependia da Kelly lembrar
-- de dar baixa, e por isso nascia desligado. Agora o proprio aluno evita o
-- bloqueio anexando o comprovante, entao ligar por padrao deixou de ser risco.

alter table mensalidade
  -- caminho dentro do bucket; a URL de visualizacao e gerada na hora e expira
  add column comprovante_caminho text,
  add column enviado_em timestamptz;

-- sete dias de tolerancia e bloqueio ligado passam a ser o padrao
alter table aluno
  alter column dias_tolerancia set default 7,
  alter column bloquear_por_atraso set default true;

update aluno set dias_tolerancia = 7, bloquear_por_atraso = true;

-- ---------------------------------------------------------------------------
-- ONDE OS COMPROVANTES FICAM
--
-- Bucket privado: comprovante tem nome, valor e conta de quem pagou. Nada aqui
-- e acessivel por link direto — a Kelly ve por um endereco temporario, gerado
-- pelo servidor no momento em que ela abre a tela.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  6291456, -- 6 MB, com folga para print de celular
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;
