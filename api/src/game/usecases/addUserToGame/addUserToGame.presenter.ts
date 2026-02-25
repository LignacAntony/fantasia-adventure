import type { Game } from "@/types/game.js";


export interface IAddUserToGameUsecasePresenter<
  SuccessType,
  NotFoundType,
  InvalidArgsType,
> {
  success(game: Game): SuccessType;
  notFound(): NotFoundType;
  invalidArgs(): InvalidArgsType;
}
