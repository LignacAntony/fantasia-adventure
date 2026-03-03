import { z } from "zod";
import type { Server, Socket } from "socket.io";
import { gameRepository } from "./repository/game.repository.js";

const joinLeaveSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().min(1),
  username: z.string().min(1),
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

export function registerGameSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

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
      if (!result.success) {
        socket.emit("game:error", {
          message: "Invalid payload",
          errors: result.error.issues,
        });
        return;
      }
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
    });
  });
}
