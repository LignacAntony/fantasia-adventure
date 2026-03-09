import type { User } from "./user.ts";
import type {
  AiNarrationOutput,
  NarrationHistoryEntry,
} from "../00_infra/openai/ai.types.js";

export type GameStatus = "lobby" | "en_cours" | "terminée" | "abandonnée";

export interface Game {
  id: string;
  name: string;
  theme: string;
  totalSteps: number;
  currentStep: number;
  status: GameStatus;
  hostId: string | null;
  users: User[];
  currentNarration: AiNarrationOutput | null;
  history: NarrationHistoryEntry[];
}
