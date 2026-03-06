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
      users: [],
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
    return game;
  }

  findAll(): Game[] {
    return db;
  }

  reset(): void {
    db.length = 0;
  }
}

export const gameRepository = new GameRepository();
