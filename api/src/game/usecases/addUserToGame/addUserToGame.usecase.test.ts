import { beforeEach, describe, expect, it } from "vitest";

import { GameRepository } from "../../repository/game.repository.js";
import { AddUserToGameUsecase } from "./addUserToGame.usecase.js";
import type { Game } from "@/types/game.js";

let repo: GameRepository;
let usecase: AddUserToGameUsecase<Game, "not_found", "invalid_args">;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
  usecase = new AddUserToGameUsecase(repo, {
    success: (game) => game,
    notFound: () => "not_found" as const,
    invalidArgs: () => "invalid_args" as const,
  });
});

describe("AddUserToGameUsecase", () => {
  it("should add a user with a valid uuid and the correct username", async () => {
    const game = repo.create({ name: "Test", theme: "Forêt", totalSteps: 5 });
    const result = await usecase.execute(
      { id: game.id },
      { username: "Alice" },
    );
    expect(result).not.toBe("not_found");
    expect(result).not.toBe("invalid_args");
    const user = (result as Game).users[0];
    expect(user?.username).toBe("Alice");
    expect(user?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should return notFound when game does not exist", async () => {
    const validUuid = "00000000-0000-4000-8000-000000000000";
    const result = await usecase.execute(
      { id: validUuid },
      { username: "Alice" },
    );
    expect(result).toBe("not_found");
  });

  it("should return invalidArgs when id is not a uuid", async () => {
    const result = await usecase.execute(
      { id: "not-a-uuid" },
      { username: "Alice" },
    );
    expect(result).toBe("invalid_args");
  });

  it("should return invalidArgs when username is empty", async () => {
    const game = repo.create({ name: "Test", theme: "Forêt", totalSteps: 5 });
    const result = await usecase.execute({ id: game.id }, { username: "" });
    expect(result).toBe("invalid_args");
  });

  it("should support multiple users", async () => {
    const game = repo.create({ name: "Test", theme: "Forêt", totalSteps: 5 });
    await usecase.execute({ id: game.id }, { username: "Alice" });
    await usecase.execute({ id: game.id }, { username: "Bob" });
    expect(game.users).toHaveLength(2);
  });
});
