import { z } from "zod";
import type { Server, Socket } from "socket.io";
import { gameRepository } from "./repository/game.repository.js";
import type { User } from "@/types/user.js";
import { generateNarration } from "@/00_infra/openai/ai.service.js";

const joinLeaveSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().min(1),
  username: z.string().min(1),
});

const playerJoinSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
});

const gameStartSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
});

const messageSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().min(1),
  username: z.string().min(1),
  text: z.string().min(1),
});

const choiceSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().min(1),
  choice: z.string().min(1),
});

/** Track who is currently present in each lobby: gameId → Set<userId> */
const lobbyPresence = new Map<string, Set<string>>();

function getLobbyState(
  gameId: string,
): { players: User[]; hostId: string | null } | null {
  const game = gameRepository.findById(gameId);
  if (!game) return null;
  const presence = lobbyPresence.get(gameId) ?? new Set<string>();
  const presentPlayers = game.users.filter((u) => presence.has(u.id));
  const hostId =
    game.hostId && presence.has(game.hostId)
      ? game.hostId
      : (game.users.find((u) => presence.has(u.id))?.id ?? null);
  return { players: presentPlayers, hostId };
}

function addPresence(gameId: string, userId: string): void {
  if (!lobbyPresence.has(gameId)) lobbyPresence.set(gameId, new Set());
  lobbyPresence.get(gameId)!.add(userId);
}

function removePresence(gameId: string, userId: string): void {
  lobbyPresence.get(gameId)?.delete(userId);
}

export function registerGameSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

    /** Lobby: player joins the socket room and triggers a lobby:update broadcast */
    socket.on("player:join", (payload: unknown) => {
      const result = playerJoinSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId } = result.data;

      const game = gameRepository.findById(gameId);
      if (!game) {
        socket.emit("game:error", { message: "Game not found" });
        return;
      }

      // Track presence and store for disconnect cleanup
      addPresence(gameId, userId);
      socket.data.gameId = gameId;
      socket.data.userId = userId;

      socket.join(gameId);
      console.log(`[Socket] ${userId} joined lobby ${gameId}`);

      const state = getLobbyState(gameId);
      if (state) io.to(gameId).emit("lobby:update", state);
    });

    /** Lobby: player leaves (explicit — SPA navigation) */
    socket.on("player:leave", (payload: unknown) => {
      const result = playerJoinSchema.safeParse(payload);
      if (!result.success) return;
      const { gameId, userId } = result.data;

      removePresence(gameId, userId);
      socket.leave(gameId);
      socket.data.gameId = undefined;
      socket.data.userId = undefined;
      console.log(`[Socket] ${userId} left lobby ${gameId}`);

      const state = getLobbyState(gameId);
      if (state) io.to(gameId).emit("lobby:update", state);
    });

    socket.on("game:start", async (payload: unknown) => {
      const result = gameStartSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId } = result.data;

      const game = gameRepository.findById(gameId);
      if (!game) {
        socket.emit("game:error", { message: "Game not found" });
        return;
      }
      if (game.hostId !== userId) {
        socket.emit("game:error", {
          message: "Seul l'hôte peut lancer la partie",
        });
        return;
      }
      if (game.status !== "lobby") {
        socket.emit("game:error", { message: "La partie a déjà commencé" });
        return;
      }

      // Only include players currently present in the lobby
      const presence = lobbyPresence.get(gameId) ?? new Set<string>();
      const presentPlayers = game.users.filter((u) => presence.has(u.id));
      if (presentPlayers.length < 2) {
        socket.emit("game:error", {
          message: "Il faut au moins 2 joueurs présents pour démarrer",
        });
        return;
      }

      // Transition → en_cours
      game.status = "en_cours";
      game.currentStep = 1;

      // Notify everyone: show loading screen
      io.to(gameId).emit("game:starting", {
        currentStep: 1,
        totalSteps: game.totalSteps,
      });

      console.log(`[Socket] Generating initial narration for game ${gameId}…`);

      try {
        const narration = await generateNarration({
          players: presentPlayers.map((u) => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
          })),
          theme: game.theme,
          totalSteps: game.totalSteps,
          currentStep: 1,
          history: [],
        });

        game.currentNarration = narration;

        io.to(gameId).emit("game:started", {
          narration: narration.narration,
          suggestions: narration.suggestions,
          currentStep: 1,
          totalSteps: game.totalSteps,
        });

        console.log(`[Socket] Narration ready for game ${gameId}`);
      } catch (error) {
        console.error("[Socket] Failed to generate initial narration:", error);
        // Rollback
        game.status = "lobby";
        game.currentStep = 0;
        io.to(gameId).emit("game:error", {
          message: "Impossible de générer la narration, réessaie.",
        });
      }
    });

    // Legacy game events (kept for future game phase)
    socket.on("game:join", (payload: unknown) => {
      const result = joinLeaveSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId, username } = result.data;
      const game = gameRepository.findById(gameId);
      if (!game) {
        socket.emit("game:error", { message: "Game not found" });
        return;
      }
      socket.join(gameId);
      console.log(`[Socket] ${username} (${userId}) joined room ${gameId}`);
      socket
        .to(gameId)
        .emit("game:player-joined", { gameId, userId, username });
    });

    socket.on("game:leave", (payload: unknown) => {
      const result = joinLeaveSchema.safeParse(payload);
      if (!result.success) return;
      const { gameId, userId, username } = result.data;
      socket.leave(gameId);
      console.log(`[Socket] ${username} (${userId}) left room ${gameId}`);
      io.to(gameId).emit("game:player-left", { gameId, userId, username });
    });

    socket.on("game:message", (payload: unknown) => {
      const result = messageSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId, username, text } = result.data;
      if (!socket.rooms.has(gameId)) {
        socket.emit("game:error", { message: "You are not in this game room" });
        return;
      }
      console.log(
        `[Socket] ${username} (${userId}) sent message in ${gameId}: ${text}`,
      );
      io.to(gameId).emit("game:message", { gameId, userId, username, text });
    });

    socket.on("game:choice", (payload: unknown) => {
      const result = choiceSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId, choice } = result.data;
      if (!socket.rooms.has(gameId)) {
        socket.emit("game:error", { message: "You are not in this game room" });
        return;
      }
      console.log(`[Socket] ${userId} made choice in ${gameId}: ${choice}`);
      io.to(gameId).emit("game:narration", { gameId, userId, choice });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] disconnected: ${socket.id}`);
      const { gameId, userId } = socket.data as {
        gameId?: string;
        userId?: string;
      };
      if (!gameId || !userId) return;
      console.log(`[Socket] cleanup: ${userId} left presence of ${gameId}`);
      removePresence(gameId, userId);
      const state = getLobbyState(gameId);
      if (state) io.to(gameId).emit("lobby:update", state);
    });
  });
}
