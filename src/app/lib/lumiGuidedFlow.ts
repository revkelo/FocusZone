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
  mobile: "\u{1F4F1}",
};

const guidedCategories: GuidedCategory[] = [
  {
    id: "smart-kits",
    label: "Smart Kits de biblioteca",
    question: "¿Qué quieres saber sobre los Smart Kits?",
    options: [
      {
        id: "smartkits-que-son",
        label: "Qué son",
        quickReply: `${E.books} Los Smart Kits son guías digitales por programa académico con libros, artículos, revistas y recursos confiables para apoyar el estudio autónomo.`,
      },
      {
        id: "smartkits-programas",
        label: "Facultades y programas",
        quickReply: `${E.building} Hay Smart Kits para Medicina, Enfermería, Odontología, Psicología, Creación y Comunicación, Ingeniería, Ciencias, Jurídicas y Políticas, Económicas y Administrativas, Humanidades y Educación.`,
      },
      {
        id: "smartkits-acceso",
        label: "Cómo acceder",
        quickReply: `${E.globe} Se consultan en formato digital interactivo con enlaces directos. Te recomiendo pedir el enlace del programa específico en la biblioteca.`,
      },
      {
        id: "smartkits-ubicacion-horario",
        label: "Ubicación y horario",
        quickReply: `${E.calendar} Biblioteca Juan Roa Vásquez: Av. Cra. 9 No. 131 A - 02, Bloque O, Piso 3, Bogotá. Horario: L-V 6:00 a.m.-10:00 p.m.; sábados 8:00 a.m.-4:00 p.m.; externos L-V 7:00 a.m.-5:00 p.m.`,
      },
    ],
  },
  {
    id: "bases-2026",
    label: "Bases de datos 2026",
    question: "¿Qué base de datos necesitas?",
    options: [
      {
        id: "db-mcgraw",
        label: "McGraw-Hill Ebooks 7-24",
        quickReply: `${E.books} E-books para Ingenierías y Administración. Ideal para consulta de conceptos, apoyo de clases y proyectos aplicados.`,
      },
      {
        id: "db-cambridge",
        label: "Cambridge University Press",
        quickReply: `${E.books} Journals Complete + Cambridge Ebooks con contenido multidisciplinario en libros y revistas académicas.`,
      },
      {
        id: "db-cochrane",
        label: "Cochrane Collection Plus",
        quickReply: `${E.check} Evidencia clínica de alta calidad: revisiones sistemáticas y ensayos para salud e investigación clínica.`,
      },
      {
        id: "db-enferteca",
        label: "Enferteca",
        quickReply: `${E.brain} Biblioteca digital de enfermería en español con contenido especializado para formación y consulta.`,
      },
      {
        id: "db-gale",
        label: "Gale Research Complete",
        quickReply: `${E.globe} Incluye e-books, revistas, noticias, literatura, fuentes primarias y negocios. Muy útil para trabajos interdisciplinarios.`,
      },
      {
        id: "db-gideon",
        label: "GIDEON",
        quickReply: `${E.magnify} Plataforma para enfermedades infecciosas, epidemiología y microbiología con enfoque técnico y clínico.`,
      },
      {
        id: "db-iop",
        label: "IOPscience Extras",
        quickReply: `${E.rocket} Publicaciones científicas en física y áreas relacionadas para consulta de alto nivel académico.`,
      },
    ],
  },
  {
    id: "investigacion-2026",
    label: "Herramientas de investigación",
    question: "¿Qué herramienta necesitas para investigar?",
    options: [
      {
        id: "tool-compilatio",
        label: "Compilatio",
        quickReply: `${E.check} Analiza originalidad, similitud y posible IA. Restricción: uso disponible solo para docentes.`,
      },
      {
        id: "tool-rayyan",
        label: "Rayyan Enterprise",
        quickReply: `${E.magnify} Apoyo con IA para revisiones sistemáticas: filtra y organiza literatura científica de forma más ágil.`,
      },
      {
        id: "tool-sage",
        label: "Sage Research Methods",
        quickReply: `${E.brain} Recurso para metodologías de investigación: diseños, métodos y enfoques para proyectos académicos.`,
      },
    ],
  },
  {
    id: "ova-2026",
    label: "Objetos virtuales de aprendizaje",
    question: "¿Qué OVA quieres explorar?",
    options: [
      {
        id: "ova-clinical-cases",
        label: "Clinical Cases - Elsevier",
        quickReply: `${E.brain} Casos clínicos interactivos para fortalecer razonamiento clínico y toma de decisiones en salud.`,
      },
      {
        id: "ova-cloudlabs",
        label: "CloudLabs",
        quickReply: `${E.laptop} Simuladores de laboratorio. Restricción: disponible solo en el DataLab.`,
      },
      {
        id: "ova-jaypee",
        label: "Jaypee Digital",
        quickReply: `${E.books} Plataforma para Medicina con libros, videos, revistas y bancos de preguntas.`,
      },
      {
        id: "ova-jove-business",
        label: "JoVE Business",
        quickReply: `${E.chart} Videos académicos sobre negocios, finanzas y marketing para aprendizaje aplicado.`,
      },
      {
        id: "ova-lectimus",
        label: "Lectimus",
        quickReply: `${E.target} Recurso para fortalecer competencias lectoras. Restricción: acceso por solicitud.`,
      },
      {
        id: "ova-mylab-math",
        label: "MyLab Math",
        quickReply: `${E.stopwatch} Plataforma de aprendizaje de matemáticas. Restricción: uso exclusivo del departamento de matemáticas.`,
      },
      {
        id: "ova-neurosurgical-atlas",
        label: "Neurosurgical Atlas",
        quickReply: `${E.sparkles} Plataforma interactiva especializada en neurocirugía para consulta académica y clínica.`,
      },
      {
        id: "ova-primal-vr",
        label: "Primal VR",
        quickReply: `${E.sparkles} Anatomía humana en realidad virtual. Restricción: disponible en la Torre inmersiva de la biblioteca.`,
      },
    ],
  },
  {
    id: "focus-zone",
    label: "Focus Zone y concentración",
    question: "¿Qué quieres explorar de Focus Zone?",
    options: [
      {
        id: "pomodoro-individual",
        label: "Pomodoro individual",
        quickReply: `${E.stopwatch} El pomodoro individual divide el estudio en bloques de enfoque y descanso para sostener energía y atención.`,
      },
      {
        id: "salas-pomodoro",
        label: "Salas Pomodoro",
        quickReply: `${E.handshake} Las salas pomodoro permiten estudiar con otras personas y mantener el ritmo del bloque de concentración.`,
      },
      {
        id: "retos-semanales",
        label: "Retos semanales",
        quickReply: `${E.trophy} Los retos semanales convierten hábitos en acciones concretas para reducir distracciones y mejorar constancia.`,
      },
      {
        id: "ranking",
        label: "Ranking",
        quickReply: `${E.chart} El ranking muestra avance por puntos y constancia en sesiones y retos de enfoque.`,
      },
      {
        id: "reducir-scroll",
        label: "Salir del doomscrolling",
        quickReply: `${E.noPhone} Para salir del scroll automático: define 1 tarea, activa un bloque de 25 min y deja notificaciones en silencio.`,
      },
      {
        id: "rutina",
        label: "Crear rutina de foco",
        quickReply: `${E.calendar} Una rutina base: 2 bloques pomodoro, pausa activa breve y cierre de 3 minutos para planear el siguiente bloque.`,
      },
    ],
  },
];

const quickRepliesByQuestion: Record<string, string> = {
  "que son los smart kits": `${E.books} Los Smart Kits son guías digitales por programa con recursos académicos confiables para estudio e investigación.`,
  "que facultades tienen smart kits": `${E.building} Los Smart Kits cubren programas de Medicina, Enfermería, Odontología, Psicología, Ingeniería, Ciencias, Educación y otras facultades.`,
  "donde esta la biblioteca": `${E.building} Biblioteca Juan Roa Vásquez: Av. Cra. 9 No. 131 A - 02, Bloque O, Piso 3, Bogotá.`,
  "cual es el horario de la biblioteca": `${E.calendar} Horario: L-V 6:00 a.m.-10:00 p.m.; sábados 8:00 a.m.-4:00 p.m.; usuarios externos L-V 7:00 a.m.-5:00 p.m.`,
  "que bases de datos nuevas tienen": `${E.globe} En 2026 destacan McGraw-Hill 7-24, Cambridge, Cochrane Plus, Enferteca, Gale Research Complete, GIDEON e IOPscience Extras.`,
  "que herramienta sirve para revision sistematica": `${E.magnify} Para revisiones sistemáticas puedes usar Rayyan Enterprise y complementar con Cochrane Collection Plus.`,
  "compilatio quien lo puede usar": `${E.check} Compilatio analiza originalidad, similitud y posible IA. Su uso está habilitado solo para docentes.`,
  "cloudlabs donde se usa": `${E.laptop} CloudLabs está disponible solo en el DataLab de la biblioteca.`,
  "primal vr donde se usa": `${E.sparkles} Primal VR se usa en la Torre inmersiva de la biblioteca.`,
  "mylab math quien lo usa": `${E.brain} MyLab Math es de uso exclusivo del departamento de matemáticas.`,
  "que es focus zone": `${E.target} Focus Zone promueve uso consciente de tecnología y hábitos de concentración conectados con recursos de biblioteca.`,
  "como salir del doomscrolling": `${E.noPhone} Inicia con un bloque de 25 minutos, silencia notificaciones y cambia redes por una tarea académica concreta.`,
};

const keywordQuickReplies: Array<{ keywords: string[]; reply: string }> = [
  { keywords: ["smart", "kit"], reply: `${E.books} Puedo ayudarte con Smart Kits: qué son, programas y acceso. Abre el menú rápido y entra a \"Smart Kits de biblioteca\".` },
  { keywords: ["mcgraw"], reply: `${E.books} McGraw-Hill Ebooks 7-24 ofrece e-books para Ingenierías y Administración.` },
  { keywords: ["cambridge"], reply: `${E.books} Cambridge incluye Journals Complete y Cambridge Ebooks con cobertura multidisciplinaria.` },
  { keywords: ["cochrane"], reply: `${E.check} Cochrane Collection Plus ofrece revisiones sistemáticas y ensayos de evidencia clínica.` },
  { keywords: ["enferteca"], reply: `${E.brain} Enferteca es una biblioteca digital especializada en enfermería en español.` },
  { keywords: ["gale"], reply: `${E.globe} Gale Research Complete integra libros, revistas, noticias y fuentes primarias.` },
  { keywords: ["gideon"], reply: `${E.magnify} GIDEON se enfoca en enfermedades infecciosas, epidemiología y microbiología.` },
  { keywords: ["iopscience"], reply: `${E.rocket} IOPscience Extras ofrece publicaciones científicas en física y áreas afines.` },
  { keywords: ["rayyan"], reply: `${E.magnify} Rayyan Enterprise ayuda con IA en revisiones sistemáticas.` },
  { keywords: ["compilatio"], reply: `${E.check} Compilatio: originalidad, similitud y posible IA. Disponible para docentes.` },
  { keywords: ["sage", "methods"], reply: `${E.brain} Sage Research Methods apoya el diseño metodológico de proyectos de investigación.` },
  { keywords: ["cloudlabs"], reply: `${E.laptop} CloudLabs es un simulador de laboratorio disponible solo en el DataLab.` },
  { keywords: ["jove"], reply: `${E.chart} JoVE Business ofrece videos sobre negocios, finanzas y marketing.` },
  { keywords: ["lectimus"], reply: `${E.target} Lectimus fortalece competencias lectoras y se habilita por solicitud.` },
  { keywords: ["primal", "vr"], reply: `${E.sparkles} Primal VR ofrece anatomía en realidad virtual en la Torre inmersiva.` },
  { keywords: ["horario"], reply: `${E.calendar} Horario biblioteca: L-V 6:00 a.m.-10:00 p.m.; sábados 8:00 a.m.-4:00 p.m.; externos L-V 7:00 a.m.-5:00 p.m.` },
  { keywords: ["ubicacion"], reply: `${E.building} Ubicación: Av. Cra. 9 No. 131 A - 02, Bloque O, Piso 3, Bogotá.` },
];

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

  const matchedByKeywords = keywordQuickReplies.find(({ keywords }) => keywords.every((keyword) => normalized.includes(keyword)));
  if (matchedByKeywords) {
    return matchedByKeywords.reply;
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
    "Genera una recomendación personalizada para Zone Focus en español.",
    "Mantén un tono cercano, claro y accionable en máximo 120 palabras.",
    `Categoría principal: ${categoryLabel}`,
    `Opciones seleccionadas: ${optionLabels.length > 0 ? optionLabels.join(", ") : "Ninguna"}`,
    `Contexto adicional del usuario: ${noteText}`,
    "Incluye un plan corto de 2 o 3 pasos y una siguiente acción concreta dentro de biblioteca o Focus Zone.",
  ].join("\n");
};
