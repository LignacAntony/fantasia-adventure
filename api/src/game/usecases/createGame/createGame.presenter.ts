import type { Game } from "@/types/game.js";

export interface ICreateGameUsecasePresenter<SuccessType, InvalidArgsType> {
  success(game: Game): SuccessType;
  invalidArgs(): InvalidArgsType;
}
