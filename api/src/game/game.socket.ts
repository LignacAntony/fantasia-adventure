import { z } from "zod";
import type { Server, Socket } from "socket.io";
import { gameRepository } from "./repository/game.repository.js";
import type { User } from "@/types/user.js";
import { generateNarration } from "@/00_infra/openai/ai.service.js";
import type { NarrationHistoryEntry } from "@/00_infra/openai/ai.types.js";

const playerJoinSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
});

const gameStartSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
});

const playerChoiceSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().min(1),
  choice: z.string().min(1),
});

/** Track who is currently present in each lobby: gameId → Set<userId> */
const lobbyPresence = new Map<string, Set<string>>();

/** Track pending choices for the current step: gameId → Map<userId, choice> */
const pendingChoices = new Map<string, Map<string, string>>();

/** Guard against concurrent generateNextStep calls for the same game */
const generatingSteps = new Set<string>();

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

function getPresentPlayers(gameId: string): User[] {
  const game = gameRepository.findById(gameId);
  if (!game) return [];
  const presence = lobbyPresence.get(gameId) ?? new Set<string>();
  return game.users.filter((u) => presence.has(u.id));
}

/**
 * Generates the next step narration once all players have submitted their choices.
 * Uses majority vote for collective steps.
 */
async function generateNextStep(io: Server, gameId: string): Promise<void> {
  if (generatingSteps.has(gameId)) {
    console.log(
      `[Socket] generateNextStep already in progress for ${gameId}, skipping`,
    );
    return;
  }
  generatingSteps.add(gameId);

  try {
    const game = gameRepository.findById(gameId);
    if (!game || game.status !== "en_cours") return;

    const choices = pendingChoices.get(gameId);
    if (!choices) return;

    const presentPlayers = getPresentPlayers(gameId);
    const currentNarration = game.currentNarration;

    // Build history entry from the current step choices
    let historyEntry: NarrationHistoryEntry;

    if (currentNarration?.stepType === "collective") {
      // Majority vote: count votes, pick winner (first submitted wins ties)
      const voteCounts = new Map<string, number>();
      for (const choice of choices.values()) {
        voteCounts.set(choice, (voteCounts.get(choice) ?? 0) + 1);
      }
      const winner = [...voteCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0]![0];

      historyEntry = {
        stepType: "collective",
        narration: currentNarration.narration,
        choices: presentPlayers.map((p) => ({
          playerId: p.id,
          playerName: p.username,
          avatar: p.avatar,
          choice: winner,
        })),
      };
    } else {
      // Individual: each player's own choice
      historyEntry = {
        stepType: "individual",
        narration: currentNarration?.narration ?? "",
        choices: presentPlayers.map((p) => ({
          playerId: p.id,
          playerName: p.username,
          avatar: p.avatar,
          choice: choices.get(p.id) ?? "",
        })),
      };
    }

    const nextStep = game.currentStep + 1;

    // Notify everyone: loading screen
    io.to(gameId).emit("game:starting", {
      currentStep: nextStep,
      totalSteps: game.totalSteps,
    });

    // Clear pending choices before the async call
    pendingChoices.delete(gameId);

    console.log(
      `[Socket] Generating step ${nextStep} narration for game ${gameId}…`,
    );

    try {
      const updatedHistory = [...game.history, historyEntry];

      const narration = await generateNarration({
        players: presentPlayers.map((u) => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
        })),
        theme: game.theme,
        totalSteps: game.totalSteps,
        currentStep: nextStep,
        history: updatedHistory,
      });

      game.currentStep = nextStep;
      game.currentNarration = narration;
      game.history = updatedHistory;

      const payload =
        narration.stepType === "collective"
          ? {
              stepType: "collective" as const,
              narration: narration.narration,
              choices: narration.choices,
              currentStep: nextStep,
              totalSteps: game.totalSteps,
            }
          : {
              stepType: "individual" as const,
              narration: narration.narration,
              suggestions: narration.suggestions,
              currentStep: nextStep,
              totalSteps: game.totalSteps,
            };

      io.to(gameId).emit("game:started", payload);
      console.log(`[Socket] Step ${nextStep} ready for game ${gameId}`);
    } catch (error) {
      console.error(`[Socket] Failed to generate step ${nextStep}:`, error);
      // Restore old choices only if no new ones arrived during the async call.
      // Players may have reconnected and re-submitted while we were retrying.
      if (!pendingChoices.has(gameId)) {
        pendingChoices.set(gameId, choices);
      }
      io.to(gameId).emit("game:error", {
        message: "Impossible de générer la narration suivante, réessaie.",
      });
    }
  } finally {
    generatingSteps.delete(gameId);
  }
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

      const presence = lobbyPresence.get(gameId) ?? new Set<string>();
      const presentPlayers = game.users.filter((u) => presence.has(u.id));
      if (presentPlayers.length < 2) {
        socket.emit("game:error", {
          message: "Il faut au moins 2 joueurs présents pour démarrer",
        });
        return;
      }

      game.status = "en_cours";
      game.currentStep = 1;

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

        const payload =
          narration.stepType === "collective"
            ? {
                stepType: "collective" as const,
                narration: narration.narration,
                choices: narration.choices,
                currentStep: 1,
                totalSteps: game.totalSteps,
              }
            : {
                stepType: "individual" as const,
                narration: narration.narration,
                suggestions: narration.suggestions,
                currentStep: 1,
                totalSteps: game.totalSteps,
              };

        io.to(gameId).emit("game:started", payload);
        console.log(`[Socket] Narration ready for game ${gameId}`);
      } catch (error) {
        console.error("[Socket] Failed to generate initial narration:", error);
        game.status = "lobby";
        game.currentStep = 0;
        io.to(gameId).emit("game:error", {
          message: "Impossible de générer la narration, réessaie.",
        });
      }
    });

    /** Game in progress: player submits their choice or vote */
    socket.on("player:choice", async (payload: unknown) => {
      const result = playerChoiceSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
      const { gameId, userId, choice } = result.data;

      const game = gameRepository.findById(gameId);
      if (!game || game.status !== "en_cours") {
        socket.emit("game:error", {
          message: "Partie introuvable ou non démarrée",
        });
        return;
      }

      const presentPlayers = getPresentPlayers(gameId);
      if (!presentPlayers.some((p) => p.id === userId)) {
        socket.emit("game:error", { message: "Tu n'es pas dans cette partie" });
        return;
      }

      if (!pendingChoices.has(gameId)) {
        pendingChoices.set(gameId, new Map());
      }
      const gameChoices = pendingChoices.get(gameId)!;

      // Ignore duplicate submissions
      if (gameChoices.has(userId)) return;

      gameChoices.set(userId, choice);

      const submitted = gameChoices.size;
      const total = presentPlayers.length;

      console.log(
        `[Socket] ${userId} chose in ${gameId} (${submitted}/${total})`,
      );

      io.to(gameId).emit("step:choices:update", { submitted, total });

      if (submitted >= total) {
        await generateNextStep(io, gameId);
      }
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

      const game = gameRepository.findById(gameId);

      // If game is in progress, check if remaining players have all submitted
      if (game?.status === "en_cours") {
        const pending = pendingChoices.get(gameId);
        if (pending) {
          const presentPlayers = getPresentPlayers(gameId);
          const submitted = [...pending.keys()].filter((id) =>
            presentPlayers.some((p) => p.id === id),
          ).length;
          const total = presentPlayers.length;

          io.to(gameId).emit("step:choices:update", { submitted, total });

          if (total > 0 && submitted >= total) {
            void generateNextStep(io, gameId);
          }
        }
        return;
      }

      const state = getLobbyState(gameId);
      if (state) io.to(gameId).emit("lobby:update", state);
    });
  });
}
