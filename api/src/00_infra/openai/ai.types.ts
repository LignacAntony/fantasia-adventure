export interface AiPlayer {
  id: string;
  username: string;
  avatar: string;
}

export interface NarrationHistoryEntry {
  stepType: "collective" | "individual";
  narration: string;
  choices: {
    playerId: string;
    playerName: string;
    avatar: string;
    choice: string;
    /** Micro-situation vécue par ce joueur (uniquement pour les étapes individuelles) */
    situation?: string;
  }[];
}

export interface GenerateNarrationInput {
  players: AiPlayer[];
  theme: string;
  totalSteps: number;
  currentStep: number;
  history: NarrationHistoryEntry[];
}

/** micro-situation unique + choix pour un joueur lors d'une étape individuelle */
export interface PlayerSuggestion {
  /** 1-2 phrases décrivant la scène personnelle vécue par ce joueur */
  situation: string;
  /** 3 actions distinctes adaptées à son avatar */
  options: string[];
}

export type AiNarrationOutput =
  | {
      stepType: "collective";
      narration: string;
      /** 3 options communes soumises au vote du groupe */
      choices: string[];
    }
  | {
      stepType: "individual";
      narration: string;
      /** suggestions[playerId] = { situation, options } (FAN-71) */
      suggestions: Record<string, PlayerSuggestion>;
    };
