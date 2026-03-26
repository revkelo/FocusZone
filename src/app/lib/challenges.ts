export interface ChallengeTemplate {
  id: string;
  title: string;
  points: number;
}

export const CHALLENGES: ChallengeTemplate[] = [
  { id: "atencion-01", title: "Mide tu tiempo de pantalla de ayer", points: 20 },
  { id: "atencion-02", title: "Cuenta desbloqueos de la mañana", points: 20 },
  { id: "atencion-03", title: "Identifica tus 3 apps de mayor uso", points: 25 },
  { id: "atencion-04", title: "Desactiva notificaciones no esenciales", points: 30 },
  { id: "atencion-05", title: "Haz 1 bloque de 25 min sin celular", points: 35 },
  { id: "atencion-06", title: "Anota momentos de procrastinación", points: 20 },
  { id: "atencion-07", title: "Escribe qué te roba atención", points: 25 },
  { id: "atencion-08", title: "Define tu app roja", points: 35 },
  { id: "atencion-09", title: "Activa escala de grises", points: 30 },
  { id: "atencion-10", title: "Franja sin celular", points: 35 },
  { id: "atencion-11", title: "Bloque focus 25/5 sin redes", points: 40 },
  { id: "atencion-12", title: "Primera media hora sin celular", points: 35 },
  { id: "atencion-13", title: "Regla sin redes en biblioteca", points: 40 },
  { id: "atencion-14", title: "Ayuno de app de 4 a 8 horas", points: 45 },
  { id: "atencion-15", title: "Reemplaza 30 min de scroll por biblioteca", points: 50 },
  { id: "atencion-16", title: "Busca 1 artículo en base académica", points: 45 },
  { id: "atencion-17", title: "Lectura en silencio 10 min", points: 45 },
  { id: "atencion-18", title: "Anota 3 ideas aprendidas", points: 40 },
  { id: "atencion-19", title: "Sesión profunda en biblioteca", points: 50 },
  { id: "atencion-20", title: "Comparte 1 aprendizaje", points: 35 },
  { id: "atencion-21", title: "Evalúa tu progreso final", points: 60 },
];
