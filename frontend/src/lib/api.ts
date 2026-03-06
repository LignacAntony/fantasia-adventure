const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type GameStatus = "lobby" | "en_cours" | "terminée" | "abandonnée";

export type Game = {
  id: string;
  name: string;
  theme: string;
  totalSteps: number;
  currentStep: number;
  status: GameStatus;
  users: { id: string; username: string }[];
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

export async function joinGame(
  gameId: string,
  username: string,
): Promise<Game> {
  const res = await fetch(`${API_URL}/games/${gameId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Failed to join game");
  return res.json();
}
