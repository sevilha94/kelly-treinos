/**
 * Exercicios que aparecem em quase toda academia, para a Kelly nao comecar de
 * uma tela em branco. Sao so nome e grupo muscular: a midia e a dica ficam por
 * conta dela, que e justamente o que diferencia a planilha dela das outras.
 *
 * A nomenclatura segue a que ela ja usa na planilha impressa.
 */
export const EXERCICIOS_COMUNS: { nome: string; grupo: string }[] = [
  // Peito
  ...comGrupo("Peito", [
    "Supino reto barra",
    "Supino reto halteres",
    "Supino inclinado barra",
    "Supino inclinado halteres",
    "Supino declinado",
    "Supino vertical máquina",
    "Supino fechado",
    "Crucifixo reto",
    "Crucifixo banco inclinado",
    "Crossover polia alta",
    "Crossover polia baixa",
    "Voador peitoral",
    "Pullover halter",
    "Flexão de braço",
    "Flexão de braço inclinada",
  ]),

  // Ombro
  ...comGrupo("Ombro", [
    "Desenvolvimento barra",
    "Desenvolvimento halteres",
    "Desenvolvimento máquina",
    "Desenvolvimento Arnold",
    "Elevação lateral halteres",
    "Elevação lateral polia",
    "Elevação frontal halteres",
    "Elevação frontal barra",
    "Elevação frontal corda",
    "Crucifixo inverso",
    "Voador inverso máquina",
    "Remada alta barra",
    "Remada alta cross",
    "Face pull corda",
    "Encolhimento halteres",
    "Encolhimento barra",
  ]),

  // Costas
  ...comGrupo("Costas", [
    "Barra fixa",
    "Barra fixa supinada",
    "Puxador frente",
    "Puxador supinado",
    "Puxador articulado",
    "Puxador triângulo",
    "Remada curvada barra",
    "Remada curvada halteres",
    "Remada baixa triângulo",
    "Remada cavalinho",
    "Remada unilateral halter",
    "Remada máquina",
    "Pulldown corda",
    "Pullface corda",
    "Voador dorsal",
    "Levantamento terra",
  ]),

  // Bíceps
  ...comGrupo("Bíceps", [
    "Rosca direta barra",
    "Rosca direta halteres",
    "Rosca alternada",
    "Rosca martelo",
    "Rosca martelo alternada",
    "Rosca concentrada",
    "Rosca unilateral concentrada",
    "Rosca scott barra",
    "Rosca scott halter",
    "Rosca barra W",
    "Rosca inversa",
    "Rosca polia baixa",
    "Rosca 21",
  ]),

  // Tríceps
  ...comGrupo("Tríceps", [
    "Tríceps testa barra",
    "Tríceps testa polia",
    "Tríceps corda",
    "Tríceps pulley barra",
    "Tríceps francês halter",
    "Tríceps banco",
    "Tríceps coice",
    "Tríceps unilateral polia",
    "Mergulho paralelas",
  ]),

  // Pernas
  ...comGrupo("Pernas", [
    "Agachamento livre",
    "Agachamento smith",
    "Agachamento halter",
    "Agachamento sumô",
    "Agachamento búlgaro",
    "Leg press 45",
    "Leg press horizontal",
    "Hack machine",
    "Cadeira extensora",
    "Cadeira extensora unilateral",
    "Mesa flexora",
    "Cadeira flexora",
    "Cadeira adutora",
    "Cadeira abdutora",
    "Stiff barra",
    "Stiff halteres",
    "Afundo",
    "Passada",
    "Subida na caixa",
  ]),

  // Glúteos
  ...comGrupo("Glúteos", [
    "Elevação pélvica",
    "Elevação pélvica com barra",
    "Glúteo no cabo",
    "Glúteo quatro apoios",
    "Coice na máquina",
    "Abdução no cabo",
    "Abdução deitado",
  ]),

  // Panturrilha
  ...comGrupo("Panturrilha", [
    "Panturrilha em pé máquina",
    "Panturrilha sentado",
    "Panturrilha no leg press",
    "Panturrilha unilateral",
    "Panturrilha no step",
  ]),

  // Abdômen
  ...comGrupo("Abdômen", [
    "Abdominal supra",
    "Abdominal infra",
    "Abdominal oblíquo",
    "Abdominal inverso",
    "Abdominal máquina",
    "Abdominal bicicleta",
    "Abdominal remador",
    "Abdominal na bola",
    "Elevação de pernas",
    "Prancha isométrica",
    "Prancha lateral",
    "Roda abdominal",
  ]),

  // Cardio
  ...comGrupo("Cardio", [
    "Esteira",
    "Bicicleta ergométrica",
    "Bicicleta spinning",
    "Elíptico",
    "Transport",
    "Escada",
    "Remo ergômetro",
    "Corda naval",
    "Pular corda",
    "Caminhada",
    "Corrida ao ar livre",
  ]),

  // Alongamento
  ...comGrupo("Alongamento", [
    "Alongamento de peitoral",
    "Alongamento de ombro",
    "Alongamento de tríceps",
    "Alongamento de dorsal",
    "Alongamento de posterior de coxa",
    "Alongamento de quadríceps",
    "Alongamento de panturrilha",
    "Alongamento de lombar",
    "Mobilidade de quadril",
    "Mobilidade de ombro",
  ]),
];

function comGrupo(grupo: string, nomes: string[]) {
  return nomes.map((nome) => ({ nome, grupo }));
}
