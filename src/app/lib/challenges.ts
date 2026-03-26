export interface ChallengeTemplate {
  id: string;
  title: string;
  points: number;
}

export const CHALLENGES: ChallengeTemplate[] = [
  { id: "challenge-1", title: "Completa 5 sesiones Pomodoro", points: 50 },
  { id: "challenge-2", title: "Haz 3 check-ins esta semana", points: 40 },
  { id: "challenge-3", title: "Termina 1 entrega antes del viernes", points: 80 },
  { id: "challenge-4", title: "Completa 8 sesiones esta semana", points: 120 },
];
