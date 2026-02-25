import type { Game } from "@/types/game.js";
import type { User } from "@/types/user.js";


export interface IGameRepository {
  create(): Game;
  findById(id: string): Game | undefined;
  addUser(gameId: string, user: User): Game | undefined;
  findAll(): Game[];
}
