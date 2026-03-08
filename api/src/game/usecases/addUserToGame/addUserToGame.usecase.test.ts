import { beforeEach, describe, expect, it } from "vitest";

import { GameRepository } from "../../repository/game.repository.js";
import { AddUserToGameUsecase } from "./addUserToGame.usecase.js";
import type { Game } from "@/types/game.js";

const gameInput = { name: "Test", theme: "Forêt", totalSteps: 5 };
const validBody = { username: "Alice", avatar: "elfe" as const };

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
  it("should add a user with a valid uuid, username and avatar", async () => {
    const game = repo.create(gameInput);
    const result = await usecase.execute({ id: game.id }, validBody);
    expect(result).not.toBe("not_found");
    expect(result).not.toBe("invalid_args");
    const user = (result as Game).users[0];
    expect(user?.username).toBe("Alice");
    expect(user?.avatar).toBe("elfe");
    expect(user?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should set the first player as host", async () => {
    const game = repo.create(gameInput);
    const result = (await usecase.execute({ id: game.id }, validBody)) as Game;
    expect(result.hostId).toBe(result.users[0]?.id);
  });

  it("should return notFound when game does not exist", async () => {
    const validUuid = "00000000-0000-4000-8000-000000000000";
    const result = await usecase.execute({ id: validUuid }, validBody);
    expect(result).toBe("not_found");
  });

  it("should return invalidArgs when id is not a uuid", async () => {
    const result = await usecase.execute({ id: "not-a-uuid" }, validBody);
    expect(result).toBe("invalid_args");
  });

  it("should return invalidArgs when username is empty", async () => {
    const game = repo.create(gameInput);
    const result = await usecase.execute(
      { id: game.id },
      { username: "", avatar: "elfe" },
    );
    expect(result).toBe("invalid_args");
  });

  it("should return invalidArgs when avatar is invalid", async () => {
    const game = repo.create(gameInput);
    const result = await usecase.execute(
      { id: game.id },
      { username: "Alice", avatar: "dragon" },
    );
    expect(result).toBe("invalid_args");
  });

  it("should support multiple users", async () => {
    const game = repo.create(gameInput);
    await usecase.execute({ id: game.id }, { username: "Alice", avatar: "elfe" });
    await usecase.execute({ id: game.id }, { username: "Bob", avatar: "nain" });
    expect(game.users).toHaveLength(2);
  });
});
