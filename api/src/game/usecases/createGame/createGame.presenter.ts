import type { Game } from "@/00_infra/types/game.ts";

export interface ICreateGameUsecasePresenter<SuccessType> {
  success(game: Game): SuccessType;
}
