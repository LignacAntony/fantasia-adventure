import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateNarrationInput } from "./ai.types.js";

vi.mock("./openai.client.js", () => ({
  openaiClient: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { openaiClient } from "./openai.client.js";
import { generateNarration } from "./ai.service.js";

const mockCreate = vi.mocked(openaiClient.chat.completions.create);

const baseInput: GenerateNarrationInput = {
  players: [
    { id: "user-1", username: "Alice", avatar: "mage" },
    { id: "user-2", username: "Bob", avatar: "warrior" },
  ],
  theme: "La forêt maudite",
  totalSteps: 5,
  currentStep: 1,
  history: [],
};

const mockIndividualResponse = (narration: string) => ({
  choices: [
    {
      message: {
        content: JSON.stringify({
          stepType: "individual",
          narration,
          suggestions: {
            "user-1": ["Lancer un sort", "Observer", "Fuir"],
            "user-2": ["Attaquer", "Défendre", "Négocier"],
          },
        }),
      },
    },
  ],
});

const mockCollectiveResponse = (narration: string) => ({
  choices: [
    {
      message: {
        content: JSON.stringify({
          stepType: "collective",
          narration,
          choices: [
            "Nous avançons ensemble",
            "Nous rebroussons chemin",
            "Nous observons",
          ],
        }),
      },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateNarration()", () => {
  it("should return parsed individual narration and suggestions", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("La forêt s'obscurcit...") as never,
    );

    const result = await generateNarration(baseInput);

    expect(result.stepType).toBe("individual");
    expect(result.narration).toBe("La forêt s'obscurcit...");
    if (result.stepType === "individual") {
      expect(result.suggestions["user-1"]).toHaveLength(3);
      expect(result.suggestions["user-2"]).toHaveLength(3);
    }
  });

  it("should return parsed collective narration and choices", async () => {
    mockCreate.mockResolvedValueOnce(
      mockCollectiveResponse("Le groupe arrive à un carrefour...") as never,
    );

    const result = await generateNarration(baseInput);

    expect(result.stepType).toBe("collective");
    expect(result.narration).toBe("Le groupe arrive à un carrefour...");
    if (result.stepType === "collective") {
      expect(result.choices).toHaveLength(3);
    }
  });

  it("should call OpenAI with json_object response format", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("Début...") as never,
    );

    await generateNarration(baseInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
      }),
      expect.anything(),
    );
  });

  it("should include system prompt with players, theme and step type rules", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("Début...") as never,
    );

    await generateNarration(baseInput);

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const systemMessage = body.messages.find((m) => m.role === "system");
    expect(systemMessage?.content).toContain("La forêt maudite");
    expect(systemMessage?.content).toContain("Alice");
    expect(systemMessage?.content).toContain("Mage");
    expect(systemMessage?.content).toContain("collective");
    expect(systemMessage?.content).toContain("individual");
  });

  it("should send initial prompt when history is empty", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("Début...") as never,
    );

    await generateNarration(baseInput);

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const userMessages = body.messages.filter((m) => m.role === "user");
    expect(userMessages[0]?.content).toContain("contexte narratif initial");
  });

  it("should include stepType in history messages", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("Chapitre 2...") as never,
    );

    await generateNarration({
      ...baseInput,
      currentStep: 2,
      history: [
        {
          stepType: "collective",
          narration: "Le groupe entre dans la forêt.",
          choices: [
            {
              playerId: "user-1",
              playerName: "Alice",
              avatar: "mage",
              choice: "Nous avançons ensemble",
            },
            {
              playerId: "user-2",
              playerName: "Bob",
              avatar: "warrior",
              choice: "Nous avançons ensemble",
            },
          ],
        },
      ],
    });

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const assistantMessage = body.messages.find((m) => m.role === "assistant");
    expect(assistantMessage?.content).toContain(
      "Le groupe entre dans la forêt.",
    );
    expect(assistantMessage?.content).toContain("collective");
  });

  it("should retry once on failure and succeed", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(
        mockIndividualResponse("Reprise après erreur...") as never,
      );

    const result = await generateNarration(baseInput);

    expect(result.narration).toBe("Reprise après erreur...");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should throw after all retries exhausted", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"));

    await expect(generateNarration(baseInput)).rejects.toThrow("Network error");
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("should throw if OpenAI returns empty content", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    } as never);

    await expect(generateNarration(baseInput)).rejects.toThrow();
  });
});
