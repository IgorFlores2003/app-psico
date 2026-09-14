export interface ScaleItemOption {
  label: string;
  value: number;
}

export interface ScaleItem {
  id: number;
  text: string;
  options: ScaleItemOption[];
  reversed?: boolean;
}

export interface ScaleDefinition {
  acronym: string;
  name: string;
  category: string;
  description: string;
  whatItMeasures: string;
  authors: string;
  reference: string;
  itemCount: number;
  scoringMethod: string;
  targetAge: string;
  instructions: string;
  usageConditions: string;
  verificationSource: string;
  cutoffs: { min: number; max: number; classification: string }[];
  items: ScaleItem[];
}

export const AUTHORIZED_SCALES: ScaleDefinition[] = [
  {
    acronym: 'PHQ-9',
    name: 'Questionário sobre a Saúde do Paciente - 9 Itens',
    category: 'Humor',
    description: 'Instrumento de autorrelato para rastreio e monitoramento da gravidade de sintomas depressivos com base nos critérios do DSM.',
    whatItMeasures: 'Gravidade de sintomatologia depressiva nas últimas 2 semanas.',
    authors: 'Kurt Kroenke, Robert L. Spitzer, Janet B. W. Williams (2001)',
    reference: 'Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.',
    itemCount: 9,
    scoringMethod: 'Soma simples dos 9 itens (0 a 3 por item). Pontuação total varia de 0 a 27.',
    targetAge: 'Adultos e adolescentes',
    instructions: 'Nas últimas 2 semanas, com que frequência você foi incomodado por qualquer um dos problemas abaixo?',
    usageConditions: 'Instrumento de domínio público / acesso aberto mantido pelos autores (Pfizer Inc. disponibiliza livremente para uso clínico sem cobrança de royalties).',
    verificationSource: 'phqscreeners.com (instruções oficiais de uso público)',
    cutoffs: [
      { min: 0, max: 4, classification: 'Sintomas mínimos ou ausência de depressão' },
      { min: 5, max: 9, classification: 'Sintomas depressivos leves' },
      { min: 10, max: 14, classification: 'Sintomas depressivos moderados' },
      { min: 15, max: 19, classification: 'Sintomas depressivos moderadamente graves' },
      { min: 20, max: 27, classification: 'Sintomas depressivos graves' },
    ],
    items: [
      {
        id: 1,
        text: 'Pouco interesse ou pouco prazer em fazer as coisas',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 2,
        text: 'Sentir-se para baixo, deprimido(a) ou sem perspectiva',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 3,
        text: 'Dificuldade para adormecer, continuar dormindo ou dormir demais',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 4,
        text: 'Sentir-se cansado(a) ou com pouca energia',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 5,
        text: 'Falta de apetite ou comer demais',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 6,
        text: 'Sentir-se mal consigo mesmo(a) — ou achar que você é um fracasso ou que decepcionou sua família ou a si mesmo(a)',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 7,
        text: 'Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 8,
        text: 'Lentidão para se movimentar ou falar, a ponto de outras pessoas terem percebido; ou o oposto: estar tão agitado(a) que você fica andando de um lado para o outro muito mais do que de costume',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 9,
        text: 'Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
    ],
  },
  {
    acronym: 'GAD-7',
    name: 'Escala do Transtorno de Ansiedade Generalizada - 7 Itens',
    category: 'Ansiedade',
    description: 'Instrumento breve e validado para triagem e mensuração da severidade dos sintomas de ansiedade generalizada.',
    whatItMeasures: 'Sintomas de ansiedade e preocupação excessiva nas últimas 2 semanas.',
    authors: 'Robert L. Spitzer, Kurt Kroenke, Janet B. W. Williams, Bernd Löwe (2006)',
    reference: 'Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.',
    itemCount: 7,
    scoringMethod: 'Soma simples dos 7 itens (0 a 3 por item). Pontuação total varia de 0 a 21.',
    targetAge: 'Adultos e adolescentes',
    instructions: 'Nas últimas 2 semanas, com que frequência você foi incomodado pelos seguintes problemas?',
    usageConditions: 'Disponibilizado livremente para uso clínico e de pesquisa sem cobrança de licença pelos autores.',
    verificationSource: 'phqscreeners.com (instruções oficiais de uso público)',
    cutoffs: [
      { min: 0, max: 4, classification: 'Ansiedade mínima' },
      { min: 5, max: 9, classification: 'Ansiedade leve' },
      { min: 10, max: 14, classification: 'Ansiedade moderada' },
      { min: 15, max: 21, classification: 'Ansiedade grave' },
    ],
    items: [
      {
        id: 1,
        text: 'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 2,
        text: 'Não ser capaz de impedir ou de controlar as preocupações',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 3,
        text: 'Preocupar-se demais com diversas coisas',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 4,
        text: 'Dificuldade para relaxar',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 5,
        text: 'Ficar tão inquieto(a) que é difícil permanecer sentado(a)',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 6,
        text: 'Ficar facilmente irritado(a) ou chateado(a)',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
      {
        id: 7,
        text: 'Sentir medo como se algo terrível fosse acontecer',
        options: [
          { label: 'Nenhuma vez', value: 0 },
          { label: 'Vários dias', value: 1 },
          { label: 'Mais da metade dos dias', value: 2 },
          { label: 'Quase todos os dias', value: 3 },
        ],
      },
    ],
  },
  {
    acronym: 'PSS-10',
    name: 'Escala de Estresse Percebido - 10 Itens',
    category: 'Estresse',
    description: 'Mede o grau em que situações da vida são avaliadas como estressantes, imprevisíveis ou incontroláveis.',
    whatItMeasures: 'Nível de estresse percebido no último mês.',
    authors: 'Sheldon Cohen, Tom Kamarck, Robin Mermelstein (1983)',
    reference: 'Cohen S, Kamarck T, Mermelstein R. A global measure of perceived stress. J Health Soc Behav. 1983;24(4):385-396.',
    itemCount: 10,
    scoringMethod: 'Escala Likert de 0 a 4. Itens 4, 5, 7 e 8 possuem pontuação invertida (0=4, 1=3, 2=2, 3=1, 4=0). Pontuação total varia de 0 a 40.',
    targetAge: 'Adultos e jovens',
    instructions: 'No último mês, com que frequência você se sentiu da forma descrita abaixo?',
    usageConditions: 'Escala acadêmica aberta para uso clínico e científico não comercial com citação dos autores.',
    verificationSource: 'Carnegie Mellon University - Laboratory for the Study of Stress, Immunity, and Disease',
    cutoffs: [
      { min: 0, max: 13, classification: 'Baixo estresse percebido' },
      { min: 14, max: 26, classification: 'Estresse percebido moderado' },
      { min: 27, max: 40, classification: 'Alto estresse percebido' },
    ],
    items: [
      {
        id: 1,
        text: 'Com que frequência você ficou chateado(a) por causa de algo que aconteceu inesperadamente?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 2,
        text: 'Com que frequência você sentiu que não conseguia controlar as coisas importantes em sua vida?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 3,
        text: 'Com que frequência você se sentiu nervoso(a) e estressado(a)?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 4,
        text: 'Com que frequência você se sentiu confiante sobre sua capacidade de lidar com seus problemas pessoais?',
        reversed: true,
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 5,
        text: 'Com que frequência você sentiu que as coisas estavam indo do seu jeito?',
        reversed: true,
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 6,
        text: 'Com que frequência você percebeu que não conseguia lidar com todas as coisas que precisava fazer?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 7,
        text: 'Com que frequência você conseguiu controlar a irritação em sua vida?',
        reversed: true,
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 8,
        text: 'Com que frequência você sentiu que estava no controle de tudo?',
        reversed: true,
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 9,
        text: 'Com que frequência você ficou zangado(a) por causa de coisas que estavam fora do seu controle?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
      {
        id: 10,
        text: 'Com que frequência você sentiu que as dificuldades estavam se acumulando a ponto de você não conseguir superá-las?',
        options: [
          { label: 'Nunca', value: 0 },
          { label: 'Quase nunca', value: 1 },
          { label: 'Às vezes', value: 2 },
          { label: 'Com frequência', value: 3 },
          { label: 'Muito frequentemente', value: 4 },
        ],
      },
    ],
  },
];

export function scoreAssessment(
  scale: ScaleDefinition,
  answers: Record<number, number>
): { score: number; classification: string } {
  let score = 0;

  for (const item of scale.items) {
    const rawVal = answers[item.id] ?? 0;
    if (item.reversed) {
      score += 4 - rawVal;
    } else {
      score += rawVal;
    }
  }

  let classification = 'Classificação não determinada';
  for (const cutoff of scale.cutoffs) {
    if (score >= cutoff.min && score <= cutoff.max) {
      classification = cutoff.classification;
      break;
    }
  }

  return { score, classification };
}
