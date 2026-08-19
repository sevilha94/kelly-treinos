import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O sistema olhando para o proprio funcionamento.
 *
 * O disparo diario e o coracao invisivel daqui: e ele que manda os lembretes,
 * lanca as mensalidades do mes e guarda a copia de seguranca. Se parar, nada
 * grita — as telas continuam funcionando, e o problema so aparece semanas
 * depois, por um aluno reclamando que nunca recebeu aviso. Foi exatamente assim
 * que o defeito do horario dos lembretes ficou de pe por dias.
 *
 * A vigilancia vive aqui, no painel, e nao dentro do disparo, por um motivo
 * simples: disparo morto nao consegue avisar que morreu. Quem observa precisa
 * estar fora do que e observado. O painel e o que a Kelly abre — entao e ele
 * que pergunta "quando foi a ultima vez que o coracao bateu?".
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cliente = SupabaseClient<any, any, any>;

/** Bate de hora em hora; 3 horas de silencio ja e sinal de que algo travou. */
export const HORAS_ATE_SUSPEITAR = 3;

/** Um dia inteiro sem bater significa que ninguem recebeu nada e nao houve copia. */
export const HORAS_ATE_PREOCUPAR = 26;

export type Saude =
  | { estado: "bem" }
  | {
      estado: "atencao" | "parado";
      horasParado: number | null;
      ultimoErro: string | null;
    };

export async function verificarSaude(supabase: Cliente): Promise<Saude> {
  const { data } = await supabase
    .from("configuracao")
    .select("chave, valor")
    .in("chave", ["cron_ultimo_em", "cron_ultimo_erro"]);

  const config = new Map((data ?? []).map((l) => [l.chave, l.valor]));
  const ultimo = config.get("cron_ultimo_em");
  // string vazia significa "rodou e deu certo"; vira null para nao contar como erro
  const ultimoErro = config.get("cron_ultimo_erro") || null;

  // nunca bateu: ou o sistema acabou de subir, ou o agendamento nunca foi ligado
  if (!ultimo) {
    return { estado: "atencao", horasParado: null, ultimoErro };
  }

  const horasParado = Math.floor(
    (Date.now() - new Date(ultimo).getTime()) / 3_600_000,
  );

  if (horasParado >= HORAS_ATE_PREOCUPAR) {
    return { estado: "parado", horasParado, ultimoErro };
  }
  if (horasParado >= HORAS_ATE_SUSPEITAR || ultimoErro) {
    return { estado: "atencao", horasParado, ultimoErro };
  }

  return { estado: "bem" };
}

/** Registra que o disparo bateu, e o que deu errado nele. */
export async function registrarBatida(
  supabase: Cliente,
  erro: string | null,
) {
  const agora = new Date().toISOString();
  await supabase.from("configuracao").upsert(
    [
      { chave: "cron_ultimo_em", valor: agora, atualizado_em: agora },
      // grava string vazia em vez de apagar a linha: assim o "deu certo desta
      // vez" tambem fica registrado, e nao vira ausencia de informacao
      { chave: "cron_ultimo_erro", valor: erro ?? "", atualizado_em: agora },
    ],
    { onConflict: "chave" },
  );
}
