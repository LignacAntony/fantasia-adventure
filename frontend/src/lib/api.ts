import type { AvatarId } from "./avatars";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type GameStatus = "lobby" | "en_cours" | "terminée" | "abandonnée";

export type Player = {
  id: string;
  username: string;
  avatar: AvatarId;
};

export type PlayerSuggestion = {
  situation: string;
  options: string[];
};

export type NarrationOutput =
  | { stepType: "collective"; narration: string; choices: string[] }
  | {
      stepType: "individual";
      narration: string;
      suggestions: Record<string, PlayerSuggestion>;
    };

export type EpilogueData = {
  epilogue: string | null;
  playerSummaries: Record<string, string> | null;
};

export type Game = {
  id: string;
  name: string;
  theme: string;
  totalSteps: number;
  currentStep: number;
  status: GameStatus;
  hostId: string | null;
  users: Player[];
  currentNarration: NarrationOutput | null;
};

export type CreateGameInput = {
  name: string;
  theme: string;
  totalSteps: number;
};

export async function createGame(input: CreateGameInput): Promise<Game> {
  const res = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create game");
  return res.json();
}

export async function getGame(gameId: string): Promise<Game> {
  const res = await fetch(`${API_URL}/games/${gameId}`);
  if (!res.ok) throw new Error("Game not found");
  return res.json();
}

export async function joinGame(
  gameId: string,
  username: string,
  avatar: AvatarId,
): Promise<Game> {
  const res = await fetch(`${API_URL}/games/${gameId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, avatar }),
  });
  if (!res.ok) throw new Error("Failed to join game");
  return res.json();
}

export type TypeStats = {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
};

export type LocalUsageStats = {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byType: { narration: TypeStats; epilogue: TypeStats };
  recentCalls: {
    timestamp: number;
    type: "narration" | "epilogue";
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
  }[];
  trackingSince: number | null;
};

export type AdminUsageResponse = {
  local: LocalUsageStats;
  openaiUsage: unknown; // raw OpenAI org API response
  hasAdminKey: boolean;
};

export async function getAdminUsage(): Promise<AdminUsageResponse> {
  const res = await fetch(`${API_URL}/admin/usage`);
  if (!res.ok) throw new Error("Failed to fetch admin usage");
  return res.json();
}
