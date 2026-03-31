export interface ChallengeTemplate {
  id: string;
  title: string;
  points: number;
  week: number;
  day: number;
}

export const CHALLENGES: ChallengeTemplate[] = [
  { id: "atencion-01", title: "Elige una red social y limítala a 15 minutos diarios.", points: 20, week: 1, day: 1 },
  { id: "atencion-02", title: "Define un momento libre de redes y anota cuántas veces lo cumples.", points: 20, week: 1, day: 2 },
  { id: "atencion-03", title: "Elige 3 comportamientos que quieres reducir: checking, comparación o rage-scrolling.", points: 25, week: 1, day: 3 },
  { id: "atencion-04", title: "Haz 60 minutos seguidos sin redes y registra qué hiciste y cómo te sentiste.", points: 30, week: 1, day: 4 },
  { id: "atencion-05", title: "Desactiva notificaciones no esenciales durante 3 horas.", points: 35, week: 1, day: 5 },
  { id: "atencion-06", title: "Crea 5 actividades offline; prueba 2 y evalúa qué tan satisfactorias fueron.", points: 20, week: 1, day: 6 },
  { id: "atencion-07", title: "Revisión semanal: identifica qué patrón se repite.", points: 25, week: 1, day: 7 },
  { id: "atencion-08", title: "Sin redes en clase: usa solo lo necesario para el estudio.", points: 35, week: 2, day: 8 },
  { id: "atencion-09", title: "Pasa los primeros 20 minutos del día sin pantallas.", points: 30, week: 2, day: 9 },
  { id: "atencion-10", title: "Usa el pomodoro de la app para tus tareas y ajústalo a tus necesidades.", points: 35, week: 2, day: 10 },
  { id: "atencion-11", title: "Invita a un amigo a hacer el reto contigo.", points: 40, week: 2, day: 11 },
  { id: "atencion-12", title: "Reduce tu tiempo de pantalla al 50% de lo normal.", points: 35, week: 2, day: 12 },
  { id: "atencion-13", title: "Haz una lista de 5 cosas que lograste hoy.", points: 40, week: 2, day: 13 },
  { id: "atencion-14", title: "Revisión semanal: qué te hizo sentir mejor y qué uso de redes quieres cambiar.", points: 45, week: 2, day: 14 },
  { id: "atencion-15", title: "Reemplaza 30 minutos de redes por otra actividad.", points: 50, week: 3, day: 15 },
  { id: "atencion-16", title: "Haz 2 bloques de enfoque de 25 minutos cada uno.", points: 45, week: 3, day: 16 },
  { id: "atencion-17", title: "Desconéctate de todas las pantallas 30 minutos antes de dormir.", points: 45, week: 3, day: 17 },
  { id: "atencion-18", title: "Elige un día ligero: máximo 30 minutos de redes en total.", points: 40, week: 3, day: 18 },
  { id: "atencion-19", title: "Usa plataformas digitales solo para aprender algo nuevo.", points: 50, week: 3, day: 19 },
  { id: "atencion-20", title: "Practica un hobby externo a las redes.", points: 35, week: 3, day: 20 },
  { id: "atencion-21", title: "Plan post-reto: escribe 3 reglas para tu uso de redes desde ahora.", points: 60, week: 3, day: 21 },
];
