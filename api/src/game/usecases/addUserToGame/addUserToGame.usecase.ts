import { v4 } from "uuid";
import type { IGameRepository } from "../../repository/game.repository.interface.ts";
import { gameIdParamsSchema, addUserBodySchema } from "../../schemas.js";
import type { IAddUserToGameUsecasePresenter } from "./addUserToGame.presenter.ts";

export class AddUserToGameUsecase<SuccessType, NotFoundType, InvalidArgsType> {
  constructor(
    private readonly repository: IGameRepository,
    private readonly presenter: IAddUserToGameUsecasePresenter<
      SuccessType,
      NotFoundType,
      InvalidArgsType
    >,
  ) {}

  async execute(
    rawParams: unknown,
    rawBody: unknown,
  ): Promise<SuccessType | NotFoundType | InvalidArgsType> {
    const parsedParams = gameIdParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      console.log(`[AddUserToGameUsecase] Invalid params`);
      return this.presenter.invalidArgs();
    }
    const parsedBody = addUserBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      console.log(`[AddUserToGameUsecase] Invalid body`);
      return this.presenter.invalidArgs();
    }
    const { id } = parsedParams.data;
    const { username } = parsedBody.data;
    const game = this.repository.addUser(id, { id: v4(), username });
    if (!game) {
      console.log(`[AddUserToGameUsecase] Game not found: ${id}`);
      return this.presenter.notFound();
    }
    console.log(
      `[AddUserToGameUsecase] User "${username}" added to game: ${id}`,
    );
    return this.presenter.success(game);
  }
}
