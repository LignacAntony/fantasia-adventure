import type { IGameRepository } from "../../repository/game.repository.interface.ts";
import { gameIdParamsSchema } from "../../schemas.js";
import type { IGetGameByIdUsecasePresenter } from "./getGameById.presenter.ts";

export class GetGameByIdUsecase<SuccessType, NotFoundType, InvalidArgsType> {
  constructor(
    private readonly repository: IGameRepository,
    private readonly presenter: IGetGameByIdUsecasePresenter<
      SuccessType,
      NotFoundType,
      InvalidArgsType
    >,
  ) {}

  async execute(
    rawParams: unknown,
  ): Promise<SuccessType | NotFoundType | InvalidArgsType> {
    const parsed = gameIdParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      console.log(`[GetGameByIdUsecase] Invalid params`);
      return this.presenter.invalidArgs();
    }
    const game = this.repository.findById(parsed.data.id);
    if (!game) {
      console.log(`[GetGameByIdUsecase] Game not found: ${parsed.data.id}`);
      return this.presenter.notFound();
    }
    console.log(`[GetGameByIdUsecase] Found game: ${game.id}`);
    return this.presenter.success(game);
  }
}
