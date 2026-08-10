"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { comunsFaltando } from "@/lib/exerciciosComuns";
import { idDoGrupo } from "@/lib/tipos";
import { arquivoDoVideoEnviado, PASTA_DOS_VIDEOS } from "@/lib/midia";

export type EstadoExercicio = { erro?: string };

/** Formatos que celular gera: Android manda .mp4, iPhone manda .mov. */
const EXTENSOES_ACEITAS: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export type EnvioDeVideo =
  | { enderecoDeEnvio: string; enderecoFinal: string }
  | { erro: string };

/**
 * Abre a porta para o navegador dela mandar o video direto ao Supabase.
 *
 * O arquivo nao passa por aqui de proposito: video de celular tem dezenas de
 * megabytes e nao cabe no corpo de uma acao de servidor. Entao o servidor faz
 * so o que exige confianca — confere o login e assina um cracha valido para um
 * unico arquivo — e o navegador carrega o resto sozinho, podendo mostrar o
 * quanto ja subiu.
 */
export async function pedirEnvioDeVideo(
  nomeDoArquivo: string,
): Promise<EnvioDeVideo> {
  await exigirLogin();

  const extensao = nomeDoArquivo.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES_ACEITAS[extensao]) {
    return { erro: "Formato de vídeo não aceito. Use um vídeo do celular." };
  }

  // nome novo em vez do nome original: dois videos chamados IMG_0001.mov nao
  // podem se sobrescrever, e o nome do arquivo dela nao vai parar na internet
  const arquivo = `${crypto.randomUUID()}.${extensao}`;

  const { data, error } = await createAdminClient()
    .storage.from("videos")
    .createSignedUploadUrl(arquivo);

  if (error || !data) {
    return { erro: "Não consegui preparar o envio. Tente de novo." };
  }

  return {
    enderecoDeEnvio: data.signedUrl,
    enderecoFinal: `${PASTA_DOS_VIDEOS}${arquivo}`,
  };
}

async function exigirLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return supabase;
}

export async function salvarExercicio(
  _anterior: EstadoExercicio,
  formData: FormData,
): Promise<EstadoExercicio> {
  const supabase = await exigirLogin();

  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const grupo = String(formData.get("grupo_muscular") ?? "").trim();

  if (!nome) return { erro: "O exercício precisa de um nome." };
  if (!grupo) return { erro: "Escolha o grupo muscular." };

  const dados = {
    nome,
    grupo_muscular: grupo,
    midia_url: String(formData.get("midia_url") ?? "").trim() || null,
    dica: String(formData.get("dica") ?? "").trim() || null,
    atualizado_em: new Date().toISOString(),
  };

  // guarda o link anterior antes de sobrescrever: se era video enviado por ela
  // e agora e outro, o arquivo velho vira peso morto no deposito
  const anterior = id
    ? (
        await supabase
          .from("exercicio")
          .select("midia_url")
          .eq("id", id)
          .maybeSingle()
      ).data?.midia_url
    : null;

  const { error } = id
    ? await supabase.from("exercicio").update(dados).eq("id", id)
    : await supabase.from("exercicio").insert(dados);

  if (error) return { erro: "Não consegui salvar. Tente de novo." };

  const videoTrocado =
    anterior !== dados.midia_url ? arquivoDoVideoEnviado(anterior) : null;
  if (videoTrocado) {
    await createAdminClient().storage.from("videos").remove([videoTrocado]);
  }

  revalidatePath("/painel/exercicios");

  // volta para a lista já rolada no grupo certo e com ele aberto, para ela ver
  // onde o exercício foi parar em vez de ter que procurar
  redirect(
    `/painel/exercicios?g=${encodeURIComponent(grupo)}#${idDoGrupo(grupo)}`,
  );
}

/**
 * Preenche a biblioteca com os exercicios comuns de academia.
 *
 * So entra o que ainda nao existe, comparando pelo nome sem acento e sem
 * maiuscula — assim "Supino Reto Barra" digitado a mao nao vira duplicata de
 * "Supino reto barra". Rodar duas vezes nao faz estrago.
 */
export async function preencherBiblioteca(): Promise<void> {
  const supabase = await exigirLogin();

  const { data: existentes } = await supabase
    .from("exercicio")
    .select("nome")
    .is("arquivado_em", null);

  const novos = comunsFaltando(
    (existentes ?? []).map((linha) => linha.nome),
  ).map(({ nome, grupo }) => ({
    nome,
    grupo_muscular: grupo,
    midia_url: null,
    dica: null,
  }));

  if (novos.length > 0) {
    await supabase.from("exercicio").insert(novos);
  }

  revalidatePath("/painel/exercicios");
  revalidatePath("/painel");
}


export async function arquivarExercicio(formData: FormData) {
  const supabase = await exigirLogin();
  const id = String(formData.get("id") ?? "");

  await supabase
    .from("exercicio")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/painel/exercicios");
  redirect("/painel/exercicios");
}
