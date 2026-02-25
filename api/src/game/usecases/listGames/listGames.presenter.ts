import type { Game } from "@/types/game.js";


export interface IListGamesUsecasePresenter<SuccessType> {
  success(games: Game[]): SuccessType;
}
