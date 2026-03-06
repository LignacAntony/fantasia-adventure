import type { Game } from "@/types/game.js";
import type { User } from "@/types/user.js";
import type { CreateGameBody } from "../schemas.js";

export interface IGameRepository {
  create(input: CreateGameBody): Game;
  findById(id: string): Game | undefined;
  addUser(gameId: string, user: User): Game | undefined;
  findAll(): Game[];
}
