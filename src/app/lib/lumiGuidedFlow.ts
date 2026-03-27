export interface GuidedOption {
  id: string;
  label: string;
  quickReply: string;
}

export interface GuidedCategory {
  id: string;
  label: string;
  question: string;
  options: GuidedOption[];
}

const E = {
  books: "\u{1F4DA}",
  brain: "\u{1F9E0}",
  laptop: "\u{1F4BB}",
  sparkles: "\u2728",
  building: "\u{1F3DB}\uFE0F",
  globe: "\u{1F310}",
  magnify: "\u{1F50E}",
  check: "\u2705",
  noPhone: "\u{1F4F5}",
  rocket: "\u{1F680}",
  target: "\u{1F3AF}",
  people: "\u{1F465}",
  calendar: "\u{1F5D3}\uFE0F",
  meditate: "\u{1F9D8}",
  stopwatch: "\u23F1\uFE0F",
  handshake: "\u{1F91D}",
  trophy: "\u{1F3C6}",
  chart: "\u{1F4C8}",
  hourglass: "\u231B",
  puzzle: "\u{1F9E9}",
  mobile: "\u{1F4F1}",
};

const guidedCategories: GuidedCategory[] = [
  {
    id: "biblioteca",
    label: "Que ofrece la biblioteca",
    question: "Que ofrece la biblioteca?",
    options: [
      {
        id: "bases-datos",
        label: "Bases de datos",
        quickReply: `${E.books} La biblioteca ofrece acceso a bases de datos academicas para apoyar busquedas, trabajos, consultas e investigacion.`,
      },
      {
        id: "cursos-talleres",
        label: "Cursos y talleres",
        quickReply: `${E.brain} La biblioteca ofrece cursos y espacios formativos para fortalecer habilidades academicas, digitales y de busqueda de informacion.`,
      },
      {
        id: "software-especializado",
        label: "Software especializado",
        quickReply: `${E.laptop} La biblioteca pone a disposicion herramientas y software que apoyan procesos de estudio, creacion e investigacion.`,
      },
      {
        id: "realidad-aumentada",
        label: "Realidad aumentada",
        quickReply: `${E.sparkles} La biblioteca cuenta con recursos tecnologicos como realidad aumentada para explorar nuevas formas de aprendizaje.`,
      },
      {
        id: "espacios-estudio",
        label: "Espacios de estudio",
        quickReply: `${E.building} La biblioteca ofrece espacios para concentracion, lectura, trabajo individual y actividades academicas.`,
      },
      {
        id: "recursos-digitales",
        label: "Recursos digitales",
        quickReply: `${E.globe} La biblioteca ofrece recursos digitales para consultar informacion, fortalecer tareas y apoyar procesos de aprendizaje.`,
      },
      {
        id: "apoyo-investigacion",
        label: "Apoyo para investigacion",
        quickReply: `${E.magnify} La biblioteca brinda apoyo para procesos de investigacion con orientacion, recursos y herramientas de consulta.`,
      },
      {
        id: "herramientas-productividad",
        label: "Herramientas de productividad",
        quickReply: `${E.check} La biblioteca integra herramientas de productividad para organizar mejor el estudio y sostener sesiones de enfoque.`,
      },
    ],
  },
  {
    id: "concentracion",
    label: "Como mejorar mi concentracion",
    question: "Que necesitas para concentrarte mejor?",
    options: [
      {
        id: "distraigo-redes",
        label: "Me distraigo con redes",
        quickReply: `${E.noPhone} Si te distraes con redes, empieza con bloques cortos de enfoque y una pausa sin pantalla entre bloques.`,
      },
      {
        id: "cuesta-empezar",
        label: "Me cuesta empezar",
        quickReply: `${E.rocket} Si te cuesta empezar, usa un objetivo pequeno de 10 minutos y arranca con una sola tarea concreta.`,
      },
      {
        id: "mantener-foco",
        label: "Me cuesta mantener el foco",
        quickReply: `${E.target} Para mantener el foco, prueba sesiones pomodoro de 25 minutos y elimina notificaciones durante el bloque.`,
      },
      {
        id: "estudiar-acompanado",
        label: "Quiero estudiar acompanado",
        quickReply: `${E.people} Puedes usar salas pomodoro para estudiar con otras personas y sostener el ritmo con objetivos compartidos.`,
      },
      {
        id: "quiero-rutina",
        label: "Quiero una rutina",
        quickReply: `${E.calendar} Una rutina efectiva puede combinar horario fijo, sesiones pomodoro y un cierre corto de reflexion diaria.`,
      },
      {
        id: "reducir-pantalla",
        label: "Quiero reducir tiempo en pantalla",
        quickReply: `${E.meditate} Alterna estudio en espacios de biblioteca, pausas activas y metas breves para reducir el tiempo en pantalla.`,
      },
    ],
  },
  {
    id: "focus-zone",
    label: "Focus Zone",
    question: "Que quieres explorar de Focus Zone?",
    options: [
      {
        id: "pomodoro-individual",
        label: "Pomodoro individual",
        quickReply: `${E.stopwatch} El pomodoro individual te ayuda a dividir el estudio en ciclos de enfoque y descanso para evitar fatiga.`,
      },
      {
        id: "salas-pomodoro",
        label: "Salas Pomodoro",
        quickReply: `${E.handshake} Las salas pomodoro permiten estudiar con otros y mantener el compromiso del bloque de concentracion.`,
      },
      {
        id: "retos-semanales",
        label: "Retos semanales",
        quickReply: `${E.trophy} Los retos semanales convierten el habito de enfoque en objetivos medibles y sostenibles.`,
      },
      {
        id: "ranking",
        label: "Ranking",
        quickReply: `${E.chart} El ranking muestra avance y constancia, ayudando a mantener motivacion con metas de enfoque.`,
      },
      {
        id: "tiempo-enfoque",
        label: "Tiempo de enfoque",
        quickReply: `${E.hourglass} El tiempo de enfoque mide tu practica real de concentracion y te permite mejorar semana a semana.`,
      },
      {
        id: "reflexion-distracciones",
        label: "Reflexion de distracciones",
        quickReply: `${E.puzzle} La reflexion de distracciones te permite detectar patrones y ajustar tu rutina para estudiar mejor.`,
      },
    ],
  },
];

const quickRepliesByQuestion: Record<string, string> = {
  "que ofrece la biblioteca": `${E.books} La biblioteca ofrece recursos academicos, digitales y espacios de estudio para apoyar concentracion, investigacion y bienestar academico.`,
  "que recursos digitales tiene": `${E.globe} La biblioteca ofrece bases de datos, recursos digitales y herramientas para apoyar consultas, tareas e investigacion.`,
  "que espacios hay para estudiar": `${E.building} La biblioteca ofrece espacios de estudio para trabajo individual, lectura, concentracion y actividades academicas.`,
  "que herramientas me ayudan a investigar": `${E.magnify} Puedes apoyarte en bases de datos, software especializado y acompanamiento para investigacion academica.`,
  "que puedo usar si quiero concentrarme": `${E.target} Puedes combinar espacios de estudio, pomodoro y herramientas de productividad para sostener el enfoque.`,
  "que es focus zone": `${E.sparkles} Focus Zone es una propuesta para usar tecnologia de forma consciente y convertir la biblioteca en un espacio de pausa digital y concentracion.`,
  "como funciona el pomodoro": `${E.stopwatch} El pomodoro divide el estudio en bloques de enfoque con pausas cortas para sostener energia y atencion.`,
  "que son las salas pomodoro": `${E.people} Las salas pomodoro son espacios de estudio acompanado donde varias personas sincronizan sesiones de enfoque.`,
  "como funcionan los retos semanales": `${E.trophy} Los retos semanales proponen metas concretas de enfoque para construir habitos de estudio sostenibles.`,
  "como se consiguen puntos": `${E.check} Los puntos se consiguen al completar sesiones de enfoque y retos dentro de Focus Zone.`,
  "como funciona el ranking": `${E.chart} El ranking organiza el progreso por puntos para mostrar constancia y avance en los habitos de enfoque.`,
  "que es doomscrolling": `${E.mobile} Doomscrolling es consumir contenido en redes por largos periodos sin un objetivo claro, lo que afecta energia y concentracion.`,
  "por que me distraigo tanto": `${E.brain} La distraccion suele aumentar por notificaciones, multitarea y ausencia de pausas. Reducir estimulos ayuda a recuperar foco.`,
  "como recuperar el foco": `${E.rocket} Para recuperar foco, define una tarea concreta, inicia con un bloque corto y elimina distractores durante ese tiempo.`,
  "que alternativas tengo al scroll": `${E.meditate} Puedes usar pomodoro, lectura en biblioteca, estudio acompanado o retos breves para reemplazar el scroll automatico.`,
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const optionsById = new Map(guidedCategories.flatMap((category) => category.options.map((option) => [option.id, option])));
const categoriesById = new Map(guidedCategories.map((category) => [category.id, category]));

export const GUIDED_CATEGORIES = guidedCategories;

export const getGuidedCategoryById = (categoryId: string) => categoriesById.get(categoryId) ?? null;

export const getGuidedOptionById = (optionId: string) => optionsById.get(optionId) ?? null;

export const getQuickReplyForOption = (optionId: string) => optionsById.get(optionId)?.quickReply ?? null;

export const getQuickReplyForQuestion = (question: string) => {
  const normalized = normalizeKey(question);
  if (!normalized) {
    return null;
  }

  if (quickRepliesByQuestion[normalized]) {
    return quickRepliesByQuestion[normalized];
  }

  return null;
};

interface GuidedPromptParams {
  categoryId: string | null;
  selectedOptionIds: string[];
  userNote?: string;
}

export const buildGuidedRecommendationPrompt = ({ categoryId, selectedOptionIds, userNote }: GuidedPromptParams) => {
  const category = categoryId ? getGuidedCategoryById(categoryId) : null;
  const selectedOptions = selectedOptionIds
    .map((optionId) => getGuidedOptionById(optionId))
    .filter((option): option is GuidedOption => option !== null);

  const optionLabels = selectedOptions.map((option) => option.label);
  const noteText = userNote?.trim() ? userNote.trim() : "Sin nota adicional";
  const categoryLabel = category?.label ?? "Sin categoria";

  return [
    "Genera una recomendacion personalizada para Zone Focus en espanol.",
    "Manten un tono cercano, claro y accionable en maximo 120 palabras.",
    `Categoria principal: ${categoryLabel}`,
    `Opciones seleccionadas: ${optionLabels.length > 0 ? optionLabels.join(", ") : "Ninguna"}`,
    `Contexto adicional del usuario: ${noteText}`,
    "Incluye un plan corto de 2 o 3 pasos y una siguiente accion concreta dentro de biblioteca o Focus Zone.",
  ].join("\n");
};
