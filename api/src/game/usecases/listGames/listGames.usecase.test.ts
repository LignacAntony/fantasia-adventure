import { beforeEach, describe, expect, it } from "vitest";
import type { Game } from "@/00_infra/types/game.ts";
import { GameRepository } from "../../repository/game.repository.ts";
import { ListGamesUsecase } from "./listGames.usecase.ts";

let repo: GameRepository;
let usecase: ListGamesUsecase<Game[]>;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
  usecase = new ListGamesUsecase(repo, {
    success: (games) => games,
  });
});

describe("ListGamesUsecase", () => {
  it("should return an empty array when no games exist", async () => {
    const games = await usecase.execute();
    expect(games).toEqual([]);
  });

  it("should return all created games", async () => {
    const g1 = repo.create();
    const g2 = repo.create();
    const games = await usecase.execute();
    expect(games).toEqual([g1, g2]);
  });
});
