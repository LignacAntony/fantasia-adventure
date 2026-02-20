import { beforeEach, describe, expect, it } from "vitest";

import { GameRepository } from "../../repository/game.repository.js";
import { CreateGameUsecase } from "./createGame.usecase.js";
import type { Game } from "@/types/game.js";

let repo: GameRepository;
let usecase: CreateGameUsecase<Game>;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
  usecase = new CreateGameUsecase(repo, {
    success: (game) => game,
  });
});

describe("CreateGameUsecase", () => {
  it("should return a game with a valid uuid", async () => {
    const game = await usecase.execute();
    expect(game.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should return a game with an empty users array", async () => {
    const game = await usecase.execute();
    expect(game.users).toEqual([]);
  });

  it("should persist the game in the repository", async () => {
    const game = await usecase.execute();
    expect(repo.findById(game.id)).toBe(game);
  });
});
