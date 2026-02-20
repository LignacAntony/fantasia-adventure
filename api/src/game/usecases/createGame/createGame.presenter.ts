import type { Game } from "@/types/game.js";

export interface ICreateGameUsecasePresenter<SuccessType> {
  success(game: Game): SuccessType;
}
