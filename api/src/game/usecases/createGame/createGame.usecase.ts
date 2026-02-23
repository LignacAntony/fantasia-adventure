import type { Game } from "@/00_infra/types/game.ts";
import type { IGameRepository } from "../../repository/game.repository.interface.ts";
import type { ICreateGameUsecasePresenter } from "./createGame.presenter.ts";

export class CreateGameUsecase<SuccessType> {
  constructor(
    private readonly repository: IGameRepository,
    private readonly presenter: ICreateGameUsecasePresenter<SuccessType>,
  ) {}

  async execute(): Promise<SuccessType> {
    const game = this.repository.create();
    console.log(`[CreateGameUsecase] Game created: ${game.id}`);
    return this.presenter.success(game);
  }
}
