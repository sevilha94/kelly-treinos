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
};

export type ItemDoTreino = {
  id: string;
  apelido: string | null;
  series: string;
  repeticoes: string;
  observacao: string | null;
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
  quadriceps_cm: number | null;
  biceps_direito_cm: number | null;
  biceps_esquerdo_cm: number | null;
  panturrilha_cm: number | null;
  gordura_corporal_pct: number | null;
  gordura_visceral: number | null;
  massa_corporal_pct: number | null;
  observacoes: string | null;
};

/**
 * As medidas da planilha impressa, na ordem em que ela mede.
 * `melhorQuando` diz para onde a seta de evolucao aponta como progresso — mas
 * so a Kelly sabe o que e progresso para cada aluno, entao a tela mostra a
 * diferenca e deixa a leitura com ela em vez de dar veredito.
 */
export const MEDIDAS = [
  { campo: "peso_kg", rotulo: "Peso", unidade: "kg" },
  { campo: "cintura_cm", rotulo: "Cintura", unidade: "cm" },
  { campo: "circunferencia_abdominal_cm", rotulo: "Abdômen", unidade: "cm" },
  { campo: "torax_cm", rotulo: "Tórax", unidade: "cm" },
  { campo: "quadril_cm", rotulo: "Quadril", unidade: "cm" },
  { campo: "quadriceps_cm", rotulo: "Quadríceps", unidade: "cm" },
  { campo: "biceps_direito_cm", rotulo: "Bíceps direito", unidade: "cm" },
  { campo: "biceps_esquerdo_cm", rotulo: "Bíceps esquerdo", unidade: "cm" },
  { campo: "panturrilha_cm", rotulo: "Panturrilha", unidade: "cm" },
  { campo: "gordura_corporal_pct", rotulo: "Gordura corporal", unidade: "%" },
  { campo: "gordura_visceral", rotulo: "Gordura visceral", unidade: "" },
  { campo: "massa_corporal_pct", rotulo: "Massa corporal", unidade: "%" },
] as const satisfies readonly {
  campo: keyof Avaliacao;
  rotulo: string;
  unidade: string;
}[];

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
