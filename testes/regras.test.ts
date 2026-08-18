import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { reordenar, posicoesQueMudaram } from "../src/lib/ordem.ts";
import { leCarga } from "../src/lib/carga.ts";
import { lerMidia } from "../src/lib/midia.ts";
import {
  nivelDaMensalidade,
  deveMostrarCobranca,
  deveBloquearPorAtraso,
  type Mensalidade,
} from "../src/lib/mensalidades.ts";

/**
 * Testes das regras que ja quebraram na vida real.
 *
 * Nao testam tela: testam a regra. Tela muda toda semana; estas decisoes —
 * quem paga, quem perde acesso, em que ordem o treino aparece — nao deveriam
 * mudar sem alguem perceber.
 */

// ---------------------------------------------------------------------------

describe("ordem dos exercicios", () => {
  const lista = [
    { id: "a", ordem: 0 },
    { id: "b", ordem: 1 },
    { id: "c", ordem: 2 },
  ];

  test("desce um exercicio uma casa", () => {
    const r = reordenar(lista, "a", "baixo");
    assert.deepEqual(r?.map((i) => i.id), ["b", "a", "c"]);
  });

  test("sobe um exercicio uma casa", () => {
    const r = reordenar(lista, "c", "cima");
    assert.deepEqual(r?.map((i) => i.id), ["a", "c", "b"]);
  });

  test("recusa subir o primeiro e descer o ultimo", () => {
    assert.equal(reordenar(lista, "a", "cima"), null);
    assert.equal(reordenar(lista, "c", "baixo"), null);
  });

  test("recusa item que nao esta na lista", () => {
    assert.equal(reordenar(lista, "zzz", "cima"), null);
  });

  // este e o defeito real: um treino da Kelly estava com 0,1,3,4,5,6,7,8,8 e
  // os botoes de mover nao faziam nada, sem avisar
  test("resolve empate na mesma posicao, que travava o botao", () => {
    const empatada = [
      { id: "a", ordem: 0 },
      { id: "b", ordem: 8 },
      { id: "c", ordem: 8 },
    ];
    const r = reordenar(empatada, "b", "baixo");
    assert.deepEqual(r?.map((i) => i.id), ["a", "c", "b"]);
    assert.deepEqual(r?.map((i) => i.ordem), [0, 1, 2]);
  });

  test("fecha buraco na numeracao ao mover", () => {
    const comBuraco = [
      { id: "a", ordem: 0 },
      { id: "b", ordem: 5 },
      { id: "c", ordem: 9 },
    ];
    const r = reordenar(comBuraco, "b", "cima");
    assert.deepEqual(r?.map((i) => i.ordem), [0, 1, 2]);
  });

  test("so grava quem realmente mudou de posicao", () => {
    const r = reordenar(lista, "b", "baixo")!;
    const mudou = posicoesQueMudaram(lista, r);
    assert.deepEqual(mudou.map((i) => i.id).sort(), ["b", "c"]);
  });
});

// ---------------------------------------------------------------------------

describe("carga digitada pelo aluno", () => {
  test("aceita numero puro", () => {
    assert.deepEqual(leCarga("12"), { valor: 12, invalida: false });
  });

  test("aceita virgula, que e como se escreve em portugues", () => {
    assert.deepEqual(leCarga("12,5"), { valor: 12.5, invalida: false });
  });

  // este era o defeito: virava nulo em silencio e o aluno perdia o registro
  test("aceita a unidade junto, como o aluno digita", () => {
    assert.equal(leCarga("12kg").valor, 12);
    assert.equal(leCarga("12 kg").valor, 12);
    assert.equal(leCarga("  20KG ").valor, 20);
  });

  test("campo vazio nao e erro — so nao ha carga", () => {
    assert.deepEqual(leCarga(""), { valor: null, invalida: false });
    assert.deepEqual(leCarga("   "), { valor: null, invalida: false });
  });

  test("marca como invalida o que nao da para entender", () => {
    assert.equal(leCarga("pesado").invalida, true);
    assert.equal(leCarga("0").invalida, true);
    assert.equal(leCarga("-5").invalida, true);
  });

  // "12x10" virava 1210 kg antes: o codigo apagava as letras e colava os
  // digitos que sobravam
  test("vale o primeiro numero, e nao os digitos grudados", () => {
    assert.equal(leCarga("12x10").valor, 12);
    assert.equal(leCarga("3 series 20kg").valor, 3);
  });

  test("recusa numero absurdo, que estraga o grafico de evolucao", () => {
    assert.equal(leCarga("5000").invalida, true);
    assert.equal(leCarga("1000").valor, 1000);
  });
});

// ---------------------------------------------------------------------------

describe("mensalidade: quem paga e quem perde acesso", () => {
  const base: Mensalidade = {
    id: "m1",
    aluno_id: "a1",
    competencia: "2026-08-01",
    valor: 250,
    vencimento: "2026-08-10",
    pago_em: null,
    forma: null,
    observacoes: null,
    comprovante_caminho: null,
    enviado_em: null,
  };

  const emDias = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().slice(0, 10);
  };

  test("sem mensalidade em aberto, esta em dia", () => {
    assert.equal(nivelDaMensalidade(undefined).nivel, "em_dia");
  });

  test("paga nao vira atrasada, por mais velha que seja", () => {
    const paga = { ...base, vencimento: emDias(90), pago_em: "2026-08-01" };
    assert.equal(nivelDaMensalidade(paga).nivel, "paga");
  });

  test("comprovante enviado sai da fila de cobranca e vai para conferencia", () => {
    const enviada = {
      ...base,
      vencimento: emDias(20),
      enviado_em: new Date().toISOString(),
    };
    assert.equal(nivelDaMensalidade(enviada).nivel, "conferir");
    assert.equal(deveMostrarCobranca(enviada), false);
  });

  test("os patamares de atraso", () => {
    assert.equal(nivelDaMensalidade({ ...base, vencimento: emDias(0) }).nivel, "em_dia");
    assert.equal(nivelDaMensalidade({ ...base, vencimento: emDias(2) }).nivel, "atrasada");
    assert.equal(nivelDaMensalidade({ ...base, vencimento: emDias(5) }).nivel, "critica");
    assert.equal(nivelDaMensalidade({ ...base, vencimento: emDias(7) }).nivel, "bloqueada");
  });

  test("cobranca aparece antes do vencimento, mas nao cedo demais", () => {
    assert.equal(deveMostrarCobranca({ ...base, vencimento: emDias(-3) }), true);
    assert.equal(deveMostrarCobranca({ ...base, vencimento: emDias(-20) }), false);
  });

  test("bloqueio so vale se a Kelly ligou naquele aluno", () => {
    const atrasada = { ...base, vencimento: emDias(30) };
    const desligado = { bloquear_por_atraso: false, dias_tolerancia: 7 };
    const ligado = { bloquear_por_atraso: true, dias_tolerancia: 7 };

    assert.equal(deveBloquearPorAtraso(desligado, atrasada), false);
    assert.equal(deveBloquearPorAtraso(ligado, atrasada), true);
  });

  // um aluno em dia perdendo o treino e o pior erro possivel deste sistema
  test("nunca bloqueia quem pagou ou ja mandou o comprovante", () => {
    const ligado = { bloquear_por_atraso: true, dias_tolerancia: 7 };
    const velha = { ...base, vencimento: emDias(60) };

    assert.equal(deveBloquearPorAtraso(ligado, { ...velha, pago_em: "2026-01-01" }), false);
    assert.equal(
      deveBloquearPorAtraso(ligado, { ...velha, enviado_em: "2026-01-01" }),
      false,
    );
    assert.equal(deveBloquearPorAtraso(ligado, undefined), false);
  });

  test("respeita a tolerancia escolhida por aluno", () => {
    const aluno = { bloquear_por_atraso: true, dias_tolerancia: 15 };
    assert.equal(deveBloquearPorAtraso(aluno, { ...base, vencimento: emDias(10) }), false);
    assert.equal(deveBloquearPorAtraso(aluno, { ...base, vencimento: emDias(15) }), true);
  });
});

// ---------------------------------------------------------------------------

describe("link da demonstracao", () => {
  test("reconhece os formatos de endereco do YouTube", () => {
    for (const url of [
      "https://youtu.be/y0UsxH8bKgg?si=abc",
      "https://www.youtube.com/watch?v=y0UsxH8bKgg",
      "https://www.youtube.com/shorts/y0UsxH8bKgg",
      "https://www.youtube-nocookie.com/embed/y0UsxH8bKgg",
    ]) {
      const m = lerMidia(url);
      assert.equal(m.tipo, "youtube", url);
    }
  });

  test("o video do YouTube comeca mudo", () => {
    const m = lerMidia("https://youtu.be/y0UsxH8bKgg");
    assert.equal(m.tipo, "youtube");
    if (m.tipo === "youtube") assert.match(m.embedUrl, /mute=1/);
  });

  test("arquivo de video solto e reconhecido pela extensao", () => {
    assert.equal(lerMidia("https://exemplo.com/a.mp4").tipo, "video");
    assert.equal(lerMidia("https://exemplo.com/a.mov").tipo, "video");
  });

  test("o resto e imagem, e vazio continua vazio", () => {
    assert.equal(lerMidia("https://exemplo.com/a.gif").tipo, "imagem");
    assert.equal(lerMidia("").tipo, "vazio");
    assert.equal(lerMidia(null).tipo, "vazio");
  });
});
