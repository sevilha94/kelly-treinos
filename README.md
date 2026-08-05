# Kelly Jhuly — Treinos

Sistema de planilha de treino online. A Kelly monta o treino pelo painel; o aluno
abre um link no celular e vê o vídeo ou a imagem de cada exercício.

Projeto independente: banco, repositório e conta próprios. Não compartilha nada
com nenhum outro sistema.

## Como funciona

- **Biblioteca de exercícios** — cadastrada uma vez, reaproveitada em todos os
  alunos. Cada exercício tem nome, grupo muscular, link da demonstração e dica.
- **Planilha do aluno** — treinos A, B, C, D (ou quantos ela quiser), cada um com
  exercícios escolhidos da biblioteca, séries e repetições.
- **Link do aluno** — `/aluno/<token>`, sem senha. O token são 32 caracteres
  aleatórios que só a Kelly conhece.

### O link da demonstração aceita qualquer coisa

`src/lib/midia.ts` olha o link e decide sozinho como mostrar: vídeo do YouTube,
arquivo de vídeo, imagem ou GIF. Dá para montar a biblioteca inteira com GIF hoje
e trocar por vídeo depois, um exercício de cada vez, sem mexer em código.

### Renomear exercício

Em dois níveis:

- `exercicio.nome` — vale para todos os alunos.
- `treino_exercicio.apelido` — vale só naquela planilha. Em branco, usa o nome da
  biblioteca.

### Controle de acesso do aluno

- **Pausar** (`aluno.acesso_bloqueado_em`) — o aluno vê um aviso em vez do treino.
  O link continua o mesmo e volta a funcionar quando ela liberar.
- **Gerar novo link** (troca `aluno.token_link`) — o link antigo morre na hora,
  inclusive para quem tiver copiado.
- **Aparelhos** (`aluno_acesso`) — conta quantos aparelhos diferentes abriram o
  link. É indício de link repassado, nunca prova: trocar de celular ou limpar o
  navegador também conta como aparelho novo. Não guardamos IP.

## Rodando

1. Crie um projeto novo no Supabase, só para este sistema.
2. Rode `supabase/migrations/0001_schema.sql` no SQL Editor.
3. Copie `.env.local.example` para `.env.local` e preencha as três chaves
   (Settings › API Keys, aba "Publishable and secret API keys").
4. Crie o usuário da Kelly em Authentication > Users.

```bash
npm install
npm run dev
```

## Stack

Next.js 16 (App Router, Server Actions), React 19, Tailwind 4, Supabase.
