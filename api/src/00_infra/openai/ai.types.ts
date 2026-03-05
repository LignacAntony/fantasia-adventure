export interface AiPlayer {
  id: string;
  username: string;
  avatar: string;
}

export interface NarrationHistoryEntry {
  narration: string;
  choices: {
    playerId: string;
    playerName: string;
    avatar: string;
    choice: string;
  }[];
}

export interface GenerateNarrationInput {
  players: AiPlayer[];
  theme: string;
  totalSteps: number;
  currentStep: number;
  history: NarrationHistoryEntry[];
}

export interface AiNarrationOutput {
  narration: string;
  /** suggestions[playerId] = ["choice 1", "choice 2", "choice 3"] */
  suggestions: Record<string, string[]>;
}
