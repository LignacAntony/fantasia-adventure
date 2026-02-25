import type { Game } from "@/types/game.js";


export interface IGetGameByIdUsecasePresenter<
  SuccessType,
  NotFoundType,
  InvalidArgsType,
> {
  success(game: Game): SuccessType;
  notFound(): NotFoundType;
  invalidArgs(): InvalidArgsType;
}
