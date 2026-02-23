import type { Game } from "@/00_infra/types/game.ts";

export interface IListGamesUsecasePresenter<SuccessType> {
  success(games: Game[]): SuccessType;
}
