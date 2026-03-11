import { beforeEach, describe, expect, it } from "vitest";

import { GameRepository } from "../../repository/game.repository.js";
import { CreateGameUsecase } from "./createGame.usecase.js";
import type { Game } from "@/types/game.js";

const validBody = {
  name: "Aventure test",
  theme: "La forêt maudite",
  totalSteps: 5,
};

type Result = Game | "invalidArgs";

let repo: GameRepository;
let usecase: CreateGameUsecase<Game, "invalidArgs">;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
  usecase = new CreateGameUsecase(repo, {
    success: (game) => game,
    invalidArgs: () => "invalidArgs" as const,
  });
});

describe("CreateGameUsecase", () => {
  it("should return a game with a valid uuid", async () => {
    const result = (await usecase.execute(validBody)) as Game;
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should return a game with the provided fields", async () => {
    const result = (await usecase.execute(validBody)) as Game;
    expect(result.name).toBe("Aventure test");
    expect(result.theme).toBe("La forêt maudite");
    expect(result.totalSteps).toBe(5);
    expect(result.status).toBe("lobby");
    expect(result.currentStep).toBe(0);
    expect(result.users).toEqual([]);
  });

  it("should persist the game in the repository", async () => {
    const result = (await usecase.execute(validBody)) as Game;
    expect(repo.findById(result.id)).toBe(result);
  });

  it("should return invalidArgs when name is missing", async () => {
    const result: Result = await usecase.execute({
      theme: "Forêt",
      totalSteps: 5,
    });
    expect(result).toBe("invalidArgs");
  });

  it("should return invalidArgs when totalSteps is out of range", async () => {
    const result: Result = await usecase.execute({
      ...validBody,
      totalSteps: 6,
    });
    expect(result).toBe("invalidArgs");
  });

  it("should return invalidArgs when theme is empty", async () => {
    const result: Result = await usecase.execute({ ...validBody, theme: "" });
    expect(result).toBe("invalidArgs");
  });
});
