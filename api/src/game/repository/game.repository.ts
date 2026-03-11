import { v4 } from "uuid";
import type { IGameRepository } from "./game.repository.interface.js";
import type { Game } from "@/types/game.js";
import type { User } from "@/types/user.js";
import type { CreateGameBody } from "../schemas.js";

const db: Game[] = [];

export class GameRepository implements IGameRepository {
  create(input: CreateGameBody): Game {
    const game: Game = {
      id: v4(),
      name: input.name,
      theme: input.theme,
      totalSteps: input.totalSteps,
      currentStep: 0,
      status: "lobby",
      hostId: null,
      users: [],
      currentNarration: null,
      history: [],
    };
    db.push(game);
    return game;
  }

  findById(id: string): Game | undefined {
    return db.find((p) => p.id === id);
  }

  addUser(gameId: string, user: User): Game | undefined {
    const game = this.findById(gameId);
    if (!game) return undefined;
    game.users.push(user);
    if (!game.hostId) game.hostId = user.id; // first player becomes host
    return game;
  }

  removeUser(gameId: string, userId: string): Game | undefined {
    const game = this.findById(gameId);
    if (!game) return undefined;
    game.users = game.users.filter((u) => u.id !== userId);
    if (game.hostId === userId) {
      game.hostId = game.users[0]?.id ?? null;
    }
    return game;
  }

  updateUserStatus(
    gameId: string,
    userId: string,
    status: NonNullable<User["status"]>,
  ): void {
    const game = this.findById(gameId);
    if (!game) return;
    const user = game.users.find((u) => u.id === userId);
    if (user) user.status = status;
  }

  findAll(): Game[] {
    return db;
  }

  reset(): void {
    db.length = 0;
  }
}

export const gameRepository = new GameRepository();
