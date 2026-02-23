import type { Game } from "@/00_infra/types/game.ts";

export interface IAddUserToGameUsecasePresenter<
  SuccessType,
  NotFoundType,
  InvalidArgsType,
> {
  success(game: Game): SuccessType;
  notFound(): NotFoundType;
  invalidArgs(): InvalidArgsType;
}
