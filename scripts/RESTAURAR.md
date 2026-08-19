# Como trazer o sistema de volta

Este é o caminho de volta quando alguma coisa acontece com o banco: alguém
apaga o que não devia, uma migração sai errada, a conta do Supabase se perde.

**Este procedimento já foi ensaiado de verdade** em 19/08/2026: um aluno inteiro
foi apagado do banco de produção — a tela dele passou a responder 404 — e voltou
completo pela cópia, com o mesmo link secreto, o mesmo treino, a mesma sessão e
o mesmo registro de acesso. A comparação linha a linha depois disso não acusou
nenhuma diferença.

## O que existe

- Uma cópia por dia, gerada sozinha na primeira execução do dia (por volta da
  meia-noite de Brasília), guardada no depósito privado `copias` do Supabase.
- Ficam as cópias dos últimos 30 dias.
- A Kelly baixa qualquer uma delas pelo painel, em **Cópia de segurança**.

## Antes de qualquer coisa

Gere uma cópia nova. O que está no banco agora, mesmo quebrado, pode conter algo
que a cópia de ontem não tem — e restaurar por cima apaga isso.

## Os comandos

Precisa das duas variáveis de ambiente:

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
```

**1. Conferir, sem escrever nada.** Sempre comece por aqui.

```
node --import ./testes/preparar.mjs scripts/restaurar.mts --conferir
```

Ele lista tabela por tabela o que está faltando ou diferente em relação à cópia.

**2. Restaurar.**

```
node --import ./testes/preparar.mjs scripts/restaurar.mts --restaurar
```

Repõe linha por linha, na ordem certa de dependência, e confere de novo no fim.
A conferência final é o que vale: não interessa o comando ter terminado sem
erro, interessa o banco ficar igual à cópia.

## Opções úteis

| Opção | Para quê |
|---|---|
| `--copia <nome>` | usar uma cópia específica em vez da mais recente |
| `--arquivo <caminho>` | usar um arquivo local, baixado pelo painel |
| `--aluno <id>` | mexer só nas linhas de um aluno — foi assim que o ensaio foi feito |
| `--tabela <nome>` | limitar a uma tabela; pode repetir |

## O que ele não faz

**Não apaga nada.** Ele repõe e atualiza, nunca remove. Uma linha criada depois
da cópia continua onde está. Isso é de propósito: num dia ruim, apagar o que
sobrou é o jeito mais fácil de transformar um problema em dois.

**Não recria as tabelas.** Se o banco tiver sido perdido inteiro, primeiro rode
as migrações de `supabase/migrations` em ordem, e só depois restaure os dados.

## Repita o ensaio de vez em quando

Cópia que ninguém restaurou é suposição, não é cópia. Vale refazer este ensaio
a cada poucos meses, sempre com um aluno de teste — nunca com aluno de verdade.
