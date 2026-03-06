import { beforeEach, describe, expect, it } from "vitest";

import { GameRepository } from "../../repository/game.repository.js";
import { ListGamesUsecase } from "./listGames.usecase.js";
import type { Game } from "@/types/game.js";

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
    const input = { name: "Test", theme: "Forêt", totalSteps: 5 };
    const g1 = repo.create(input);
    const g2 = repo.create(input);
    const games = await usecase.execute();
    expect(games).toEqual([g1, g2]);
  });
});
