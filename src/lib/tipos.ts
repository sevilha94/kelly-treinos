export type Exercicio = {
  id: string;
  nome: string;
  grupo_muscular: string;
  midia_url: string | null;
  dica: string | null;
};

export type Aluno = {
  id: string;
  nome: string;
  telefone: string | null;
  data_nascimento: string | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: string | null;
  data_inicio: string;
  token_link: string;
  observacoes: string | null;
  /** Preenchido enquanto o aluno estiver com o acesso pausado pela Kelly. */
  acesso_bloqueado_em: string | null;
  valor_mensalidade: number | null;
  dia_vencimento: number | null;
  bloquear_por_atraso: boolean;
  dias_tolerancia: number;
};

export type ItemDoTreino = {
  id: string;
  apelido: string | null;
  series: string;
  repeticoes: string;
  observacao: string | null;
  /** Descanso entre series, em segundos. Vazio = a Kelly nao definiu. */
  descanso_segundos: number | null;
  ordem: number;
  exercicio: Exercicio;
};

export type Treino = {
  id: string;
  letra: string;
  titulo: string;
  ordem: number;
  itens: ItemDoTreino[];
};

/** O apelido da planilha manda; sem apelido, vale o nome da biblioteca. */
export function nomeExibido(item: ItemDoTreino): string {
  return item.apelido?.trim() || item.exercicio.nome;
}

export const GRUPOS_MUSCULARES = [
  "Peito",
  "Ombro",
  "Costas",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Panturrilha",
  "Abdômen",
  "Cardio",
  "Alongamento",
] as const;

export type Avaliacao = {
  id: string;
  data: string;
  peso_kg: number | null;
  altura_cm: number | null;
  cintura_cm: number | null;
  circunferencia_abdominal_cm: number | null;
  torax_cm: number | null;
  quadril_cm: number | null;
  quadriceps_direito_cm: number | null;
  quadriceps_esquerdo_cm: number | null;
  biceps_direito_cm: number | null;
  biceps_esquerdo_cm: number | null;
  panturrilha_direita_cm: number | null;
  panturrilha_esquerda_cm: number | null;
  gordura_corporal_pct: number | null;
  gordura_visceral: number | null;
  massa_corporal_pct: number | null;
  observacoes: string | null;
};

/**
 * As medidas da avaliacao, na ordem em que se mede: tronco de cima para baixo,
 * depois os membros.
 *
 * `par` marca o que existe dos dois lados, para a tela conseguir mostrar a
 * diferenca entre eles. Peso e percentuais nao tem lado; braco e perna tem, e
 * a assimetria entre eles e informacao clinica, nao detalhe.
 *
 * A tela mostra a variacao mas nunca diz se e boa ou ruim: perder cintura e
 * ganhar biceps sao os dois progresso, e so a Kelly sabe qual era a meta.
 */
export const MEDIDAS = [
  { campo: "peso_kg", rotulo: "Peso", unidade: "kg" },
  { campo: "cintura_cm", rotulo: "Cintura", unidade: "cm" },
  { campo: "circunferencia_abdominal_cm", rotulo: "Abdômen", unidade: "cm" },
  { campo: "torax_cm", rotulo: "Tórax", unidade: "cm" },
  { campo: "quadril_cm", rotulo: "Quadril", unidade: "cm" },
  { campo: "biceps_direito_cm", rotulo: "Bíceps direito", unidade: "cm", par: "biceps_esquerdo_cm" },
  { campo: "biceps_esquerdo_cm", rotulo: "Bíceps esquerdo", unidade: "cm" },
  { campo: "quadriceps_direito_cm", rotulo: "Quadríceps direito", unidade: "cm", par: "quadriceps_esquerdo_cm" },
  { campo: "quadriceps_esquerdo_cm", rotulo: "Quadríceps esquerdo", unidade: "cm" },
  { campo: "panturrilha_direita_cm", rotulo: "Panturrilha direita", unidade: "cm", par: "panturrilha_esquerda_cm" },
  { campo: "panturrilha_esquerda_cm", rotulo: "Panturrilha esquerda", unidade: "cm" },
  { campo: "gordura_corporal_pct", rotulo: "Gordura corporal", unidade: "%" },
  { campo: "gordura_visceral", rotulo: "Gordura visceral", unidade: "" },
  { campo: "massa_corporal_pct", rotulo: "Massa corporal", unidade: "%" },
] as const satisfies readonly {
  campo: keyof Avaliacao;
  rotulo: string;
  unidade: string;
  par?: keyof Avaliacao;
}[];

/** Identificador do grupo na URL, para conseguir rolar ate ele e abri-lo. */
export function idDoGrupo(grupo: string): string {
  return (
    "grupo-" +
    grupo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** IMC nao fica no banco: sai de peso e altura, para nunca divergir deles. */
export function calculaImc(
  pesoKg: number | null,
  alturaCm: number | null,
): number | null {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

export function formataData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Dias inteiros entre uma data (AAAA-MM-DD) e hoje. */
export function diasAtras(iso: string): number {
  const dia = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);
}

export const DIAS_SEMANA = [
  { numero: 1, nome: "Segunda", curto: "Seg" },
  { numero: 2, nome: "Terça", curto: "Ter" },
  { numero: 3, nome: "Quarta", curto: "Qua" },
  { numero: 4, nome: "Quinta", curto: "Qui" },
  { numero: 5, nome: "Sexta", curto: "Sex" },
  { numero: 6, nome: "Sábado", curto: "Sáb" },
  { numero: 7, nome: "Domingo", curto: "Dom" },
] as const;
