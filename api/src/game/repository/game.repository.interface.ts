import type { Game } from "@/00_infra/types/game.ts";
import type { User } from "@/00_infra/types/user.ts";

export interface IGameRepository {
  create(): Game;
  findById(id: string): Game | undefined;
  addUser(gameId: string, user: User): Game | undefined;
  findAll(): Game[];
}
