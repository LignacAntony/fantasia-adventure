import type { IGameRepository } from "../../repository/game.repository.interface.ts";
import type { IListGamesUsecasePresenter } from "./listGames.presenter.ts";

export class ListGamesUsecase<SuccessType> {
  constructor(
    private readonly repository: IGameRepository,
    private readonly presenter: IListGamesUsecasePresenter<SuccessType>,
  ) {}

  async execute(): Promise<SuccessType> {
    const games = this.repository.findAll();
    console.log(`[ListGamesUsecase] Found ${games.length} game(s)`);
    return this.presenter.success(games);
  }
}
