import type { User } from "./user.ts";

export type GameStatus = "lobby" | "en_cours" | "terminée" | "abandonnée";

export interface Game {
  id: string;
  name: string;
  theme: string;
  totalSteps: number;
  currentStep: number;
  status: GameStatus;
  users: User[];
}
