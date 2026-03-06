import { beforeEach, describe, expect, it } from "vitest";
import { GameRepository } from "./game.repository.js";

const defaultInput = { name: "Aventure test", theme: "La forêt maudite", totalSteps: 5 };

let repo: GameRepository;

beforeEach(() => {
  repo = new GameRepository();
  repo.reset();
});

describe("create()", () => {
  it("should return a game with a valid uuid", () => {
    const game = repo.create(defaultInput);
    expect(game.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should return a game with the provided name, theme and totalSteps", () => {
    const game = repo.create(defaultInput);
    expect(game.name).toBe("Aventure test");
    expect(game.theme).toBe("La forêt maudite");
    expect(game.totalSteps).toBe(5);
  });

  it("should return a game with status lobby and currentStep 0", () => {
    const game = repo.create(defaultInput);
    expect(game.status).toBe("lobby");
    expect(game.currentStep).toBe(0);
  });

  it("should return a game with an empty users array", () => {
    const game = repo.create(defaultInput);
    expect(game.users).toEqual([]);
  });

  it("should persist the game in the db", () => {
    const game = repo.create(defaultInput);
    expect(repo.findById(game.id)).toBe(game);
  });
});

describe("findById()", () => {
  it("should return the game when found", () => {
    const game = repo.create(defaultInput);
    expect(repo.findById(game.id)).toBe(game);
  });

  it("should return undefined when not found", () => {
    expect(repo.findById("non-existent-id")).toBeUndefined();
  });
});

describe("addUser()", () => {
  it("should add a user to the game", () => {
    const game = repo.create(defaultInput);
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
    const game = repo.create(defaultInput);
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
    const g1 = repo.create(defaultInput);
    const g2 = repo.create({ ...defaultInput, name: "Partie 2" });
    expect(repo.findAll()).toEqual([g1, g2]);
  });
});
