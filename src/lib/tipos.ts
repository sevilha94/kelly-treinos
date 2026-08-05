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

export const DIAS_SEMANA = [
  { numero: 1, nome: "Segunda", curto: "Seg" },
  { numero: 2, nome: "Terça", curto: "Ter" },
  { numero: 3, nome: "Quarta", curto: "Qua" },
  { numero: 4, nome: "Quinta", curto: "Qui" },
  { numero: 5, nome: "Sexta", curto: "Sex" },
  { numero: 6, nome: "Sábado", curto: "Sáb" },
  { numero: 7, nome: "Domingo", curto: "Dom" },
] as const;
