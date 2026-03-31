export interface ChallengeTemplate {
  id: string;
  title: string;
  points: number;
  week: number;
  day: number;
}

export const CHALLENGES: ChallengeTemplate[] = [
  { id: "atencion-01", title: "Elegir una red social y limitar su uso a 15 minutos diarios.", points: 20, week: 1, day: 1 },
  { id: "atencion-02", title: "Definir una zona o momento libre de redes: durante la comida, en la clase de estudio, en el bus, etc. (anotar cuántas veces cumplen y qué hicieron en su lugar).", points: 20, week: 1, day: 2 },
  { id: "atencion-03", title: "Elegir 3 comportamientos que quieren reducir: checking compulsivo, compararse con otros o rage-scrolling.", points: 25, week: 1, day: 3 },
  { id: "atencion-04", title: "Elegir 60 minutos seguidos sin redes sociales y anotar qué hicieron y cómo se sintieron.", points: 30, week: 1, day: 4 },
  { id: "atencion-05", title: "Desactiva todas las notificaciones no esenciales durante 3 horas.", points: 35, week: 1, day: 5 },
  { id: "atencion-06", title: "Crear una lista de 5 actividades offline y probar al menos 2 durante el día; anotar qué tan satisfactorias fueron.", points: 20, week: 1, day: 6 },
  { id: "atencion-07", title: "Revisión semanal: ¿qué patrón se repite?", points: 25, week: 1, day: 7 },
  { id: "atencion-08", title: "Sin redes en clase, solo lo necesario en relación al estudio.", points: 35, week: 2, day: 8 },
  { id: "atencion-09", title: "Primeros 20 minutos del día sin pantallas: estirar, respirar y beber agua.", points: 30, week: 2, day: 9 },
  { id: "atencion-10", title: "Utiliza el pomodoro de la aplicación al realizar tus tareas (ajústalo a tus necesidades).", points: 35, week: 2, day: 10 },
  { id: "atencion-11", title: "Invita a un amigo a hacer el reto contigo.", points: 40, week: 2, day: 11 },
  { id: "atencion-12", title: "Reduce tu tiempo en pantalla un 50% de lo normal.", points: 35, week: 2, day: 12 },
  { id: "atencion-13", title: "Hacer una lista de 5 cosas que logré hoy.", points: 40, week: 2, day: 13 },
  { id: "atencion-14", title: "Revisión semanal: ¿qué me hizo sentir mejor hoy fuera de redes? ¿qué uso de redes quiero cambiar?", points: 45, week: 2, day: 14 },
  { id: "atencion-15", title: "Reemplaza 30 minutos de redes por otra actividad.", points: 50, week: 3, day: 15 },
  { id: "atencion-16", title: "Haz 2 bloques de enfoque (25 minutos cada uno).", points: 45, week: 3, day: 16 },
  { id: "atencion-17", title: "30 minutos antes de dormir, desconéctate de todas las pantallas.", points: 45, week: 3, day: 17 },
  { id: "atencion-18", title: "Elegir 1 día de la semana como día ligero: máximo 30 minutos en redes en total.", points: 40, week: 3, day: 18 },
  { id: "atencion-19", title: "Usar distintas plataformas solo para aprender cosas nuevas.", points: 50, week: 3, day: 19 },
  { id: "atencion-20", title: "Practicar un hobby externo a las redes.", points: 35, week: 3, day: 20 },
  { id: "atencion-21", title: "Tu plan post-reto: escribe 3 reglas para tu uso de redes a partir de ahora.", points: 60, week: 3, day: 21 },
];
