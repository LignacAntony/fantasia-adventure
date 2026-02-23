import { v4 } from "uuid";
import type { IGameRepository } from "./game.repository.interface.ts";
import type { Game } from "@/00_infra/types/game.ts";
import type { User } from "@/00_infra/types/user.ts";

const db: Game[] = [];

export class GameRepository implements IGameRepository {
  create(): Game {
    const game: Game = { id: v4(), users: [] };
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
