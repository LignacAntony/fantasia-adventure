import { beforeEach, describe, expect, it } from "vitest";
import type { Game } from "@/00_infra/types/game.ts";
import { GameRepository } from "../../repository/game.repository.ts";
import { GetGameByIdUsecase } from "./getGameById.usecase.ts";

let repo: GameRepository;
let usecase: GetGameByIdUsecase<Game, "not_found", "invalid_args">;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
  usecase = new GetGameByIdUsecase(repo, {
    success: (game) => game,
    notFound: () => "not_found" as const,
    invalidArgs: () => "invalid_args" as const,
  });
});

describe("GetGameByIdUsecase", () => {
  it("should return the game when found", async () => {
    const game = repo.create();
    const result = await usecase.execute({ id: game.id });
    expect(result).toBe(game);
  });

  it("should return notFound when game does not exist", async () => {
    const validUuid = "00000000-0000-4000-8000-000000000000";
    const result = await usecase.execute({ id: validUuid });
    expect(result).toBe("not_found");
  });

  it("should return invalidArgs when id is not a uuid", async () => {
    const result = await usecase.execute({ id: "not-a-uuid" });
    expect(result).toBe("invalid_args");
  });
});
