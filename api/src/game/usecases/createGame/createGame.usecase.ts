import type { IGameRepository } from "../../repository/game.repository.interface.ts";
import { createGameBodySchema } from "../../schemas.js";
import type { ICreateGameUsecasePresenter } from "./createGame.presenter.ts";

export class CreateGameUsecase<SuccessType, InvalidArgsType> {
  constructor(
    private readonly repository: IGameRepository,
    private readonly presenter: ICreateGameUsecasePresenter<
      SuccessType,
      InvalidArgsType
    >,
  ) {}

  async execute(rawBody: unknown): Promise<SuccessType | InvalidArgsType> {
    const parsed = createGameBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      console.log(`[CreateGameUsecase] Invalid body`);
      return this.presenter.invalidArgs();
    }
    const game = this.repository.create(parsed.data);
    console.log(`[CreateGameUsecase] Game created: ${game.id} "${game.name}"`);
    return this.presenter.success(game);
  }
}
