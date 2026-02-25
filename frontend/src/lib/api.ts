const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Game = {
  id: string;
  users: { id: string; username: string }[];
};

export async function createGame(): Promise<Game> {
  const res = await fetch(`${API_URL}/games`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create game");
  return res.json();
}

export async function joinGame(gameId: string, username: string): Promise<Game> {
  const res = await fetch(`${API_URL}/games/${gameId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Failed to join game");
  return res.json();
}
