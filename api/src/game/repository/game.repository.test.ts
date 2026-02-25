import { beforeEach, describe, expect, it } from "vitest";
import { GameRepository } from "./game.repository.js";

let repo: GameRepository;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
});

describe("create()", () => {
  it("should return a game with a valid uuid", () => {
    const game = repo.create();
    expect(game.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should return a game with an empty users array", () => {
    const game = repo.create();
    expect(game.users).toEqual([]);
  });

  it("should persist the game in the db", () => {
    const game = repo.create();
    expect(repo.findById(game.id)).toBe(game);
  });
});

describe("findById()", () => {
  it("should return the game when found", () => {
    const game = repo.create();
    expect(repo.findById(game.id)).toBe(game);
  });

  it("should return undefined when not found", () => {
    expect(repo.findById("non-existent-id")).toBeUndefined();
  });
});

describe("addUser()", () => {
  it("should add a user to the game", () => {
    const game = repo.create();
    const user = { id: "user-1", username: "Alice" };
    const updated = repo.addUser(game.id, user);
    expect(updated?.users).toContainEqual(user);
  });

  it("should return undefined when game does not exist", () => {
    const result = repo.addUser("non-existent-id", {
      id: "user-1",
      username: "Alice",
    });
    expect(result).toBeUndefined();
  });

  it("should support multiple users", () => {
    const game = repo.create();
    repo.addUser(game.id, { id: "user-1", username: "Alice" });
    repo.addUser(game.id, { id: "user-2", username: "Bob" });
    expect(game.users).toHaveLength(2);
  });
});

describe("findAll()", () => {
  it("should return an empty array when no games exist", () => {
    expect(repo.findAll()).toEqual([]);
  });

  it("should return all created games", () => {
    const g1 = repo.create();
    const g2 = repo.create();
    expect(repo.findAll()).toEqual([g1, g2]);
  });
});
