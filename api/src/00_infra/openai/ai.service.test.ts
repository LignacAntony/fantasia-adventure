import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GenerateEpilogueInput,
  GenerateNarrationInput,
} from "./ai.types.js";

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
import { generateEpilogue, generateNarration } from "./ai.service.js";

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
          choices: null,
          suggestions: [
            {
              playerId: "user-1",
              situation: "Alice aperçoit un parchemin maudit à ses pieds.",
              options: ["Lancer un sort", "Observer", "Fuir"],
            },
            {
              playerId: "user-2",
              situation: "Bob fait face à un garde ennemi.",
              options: ["Attaquer", "Défendre", "Négocier"],
            },
          ],
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
          suggestions: null,
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
      expect(result.suggestions["user-1"]?.options).toHaveLength(3);
      expect(result.suggestions["user-2"]?.options).toHaveLength(3);
      expect(result.suggestions["user-1"]?.situation).toBe(
        "Alice aperçoit un parchemin maudit à ses pieds.",
      );
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

  it("should call OpenAI with json_schema response format and strict mode", async () => {
    mockCreate.mockResolvedValueOnce(
      mockIndividualResponse("Début...") as never,
    );

    await generateNarration(baseInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        response_format: expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "narration_output",
            strict: true,
          }),
        }),
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

  it("should include alternation hint in last user message based on previous stepType", async () => {
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
    const userMessages = body.messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages.at(-1);
    // Should instruct the AI to use "individual" since previous was "collective"
    expect(lastUserMessage?.content).toContain("individual");
    expect(lastUserMessage?.content).toContain("ALTERNANCE OBLIGATOIRE");
  });

  it("should include collective hint + cross-synthesis when previous step was individual", async () => {
    mockCreate.mockResolvedValueOnce(
      mockCollectiveResponse("Étape 3...") as never,
    );

    await generateNarration({
      ...baseInput,
      currentStep: 3,
      history: [
        {
          stepType: "collective",
          narration: "Le groupe entre dans la forêt.",
          choices: [
            {
              playerId: "user-1",
              playerName: "Alice",
              avatar: "mage",
              choice: "Nous avançons",
            },
            {
              playerId: "user-2",
              playerName: "Bob",
              avatar: "warrior",
              choice: "Nous avançons",
            },
          ],
        },
        {
          stepType: "individual",
          narration: "Chacun affronte sa propre épreuve.",
          choices: [
            {
              playerId: "user-1",
              playerName: "Alice",
              avatar: "mage",
              choice: "Lancer un sort",
              situation:
                "Alice affronte un spectre solitaire dans une clairière.",
            },
            {
              playerId: "user-2",
              playerName: "Bob",
              avatar: "warrior",
              choice: "Attaquer",
              situation: "Bob découvre un piège tendu par des bandits.",
            },
          ],
        },
      ],
    });

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const userMessages = body.messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages.at(-1);

    // Should instruct the AI to use "collective" since previous was "individual"
    expect(lastUserMessage?.content).toContain('"collective"');
    expect(lastUserMessage?.content).toContain("ALTERNANCE OBLIGATOIRE");
    // Should include the cross-synthesis instruction
    expect(lastUserMessage?.content).toContain("synthétiser");
    // Should include individual situations for cross-impact synthesis
    expect(lastUserMessage?.content).toContain(
      "Alice affronte un spectre solitaire",
    );
    expect(lastUserMessage?.content).toContain("Bob découvre un piège");
    // User label should be "Résultats des actions individuelles"
    expect(lastUserMessage?.content).toContain(
      "Résultats des actions individuelles",
    );
  });

  it("should include collective hint in initial prompt when history is empty", async () => {
    mockCreate.mockResolvedValueOnce(
      mockCollectiveResponse("Le monde s'ouvre...") as never,
    );

    await generateNarration(baseInput);

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const userMessages = body.messages.filter((m) => m.role === "user");
    expect(userMessages[0]?.content).toContain("collective");
    expect(userMessages[0]?.content).toContain("TYPE D'ÉTAPE");
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
      .mockRejectedValueOnce(new Error("Network error"));

    await expect(generateNarration(baseInput)).rejects.toThrow("Network error");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should throw if OpenAI returns empty content", async () => {
    const emptyResponse = {
      choices: [{ message: { content: null } }],
    } as never;

    mockCreate
      .mockResolvedValueOnce(emptyResponse)
      .mockResolvedValueOnce(emptyResponse);

    await expect(generateNarration(baseInput)).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should normalize suggestion keys when AI uses player names instead of IDs", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              stepType: "individual",
              narration: "Test narration",
              choices: null,
              suggestions: [
                {
                  playerId: "Alice",
                  situation: "Alice découvre une carte au trésor.",
                  options: ["Option 1", "Option 2", "Option 3"],
                },
                {
                  playerId: "Bob",
                  situation: "Bob affronte un garde solitaire.",
                  options: ["Option A", "Option B", "Option C"],
                },
              ],
            }),
          },
        },
      ],
    } as never);

    const result = await generateNarration(baseInput);

    expect(result.stepType).toBe("individual");
    if (result.stepType === "individual") {
      expect(result.suggestions["user-1"]).toEqual({
        situation: "Alice découvre une carte au trésor.",
        options: ["Option 1", "Option 2", "Option 3"],
      });
      expect(result.suggestions["user-2"]).toEqual({
        situation: "Bob affronte un garde solitaire.",
        options: ["Option A", "Option B", "Option C"],
      });
    }
  });

  it("should throw when collective step has null choices", async () => {
    const badResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              stepType: "collective",
              narration: "Some narration",
              choices: null,
              suggestions: null,
            }),
          },
        },
      ],
    } as never;

    // Both attempts return the same bad response (MAX_RETRIES=1 → 2 calls)
    mockCreate
      .mockResolvedValueOnce(badResponse)
      .mockResolvedValueOnce(badResponse);

    await expect(generateNarration(baseInput)).rejects.toThrow(
      "Collective step but choices is null",
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

// ─── generateEpilogue() ──────────────────────────────────────────────

const epilogueInput: GenerateEpilogueInput = {
  players: [
    { id: "user-1", username: "Alice", avatar: "mage" },
    { id: "user-2", username: "Bob", avatar: "warrior" },
  ],
  theme: "La forêt maudite",
  totalSteps: 3,
  history: [
    {
      stepType: "collective",
      narration: "Le groupe pénètre dans la forêt.",
      choices: [
        {
          playerId: "user-1",
          playerName: "Alice",
          avatar: "mage",
          choice: "Nous avançons",
        },
        {
          playerId: "user-2",
          playerName: "Bob",
          avatar: "warrior",
          choice: "Nous avançons",
        },
      ],
    },
    {
      stepType: "individual",
      narration: "Chacun affronte sa propre épreuve.",
      choices: [
        {
          playerId: "user-1",
          playerName: "Alice",
          avatar: "mage",
          choice: "Lancer un sort",
          situation: "Alice fait face à un spectre.",
        },
        {
          playerId: "user-2",
          playerName: "Bob",
          avatar: "warrior",
          choice: "Attaquer",
          situation: "Bob découvre un piège.",
        },
      ],
    },
    {
      stepType: "collective",
      narration: "Le groupe se retrouve devant le temple.",
      choices: [
        {
          playerId: "user-1",
          playerName: "Alice",
          avatar: "mage",
          choice: "Nous entrons",
        },
        {
          playerId: "user-2",
          playerName: "Bob",
          avatar: "warrior",
          choice: "Nous entrons",
        },
      ],
    },
  ],
};

const mockEpilogueResponse = (epilogue: string) => ({
  choices: [
    {
      message: {
        content: JSON.stringify({
          epilogue,
          playerSummaries: [
            {
              playerId: "user-1",
              summary: "Alice a sauvé le groupe grâce à sa magie.",
            },
            { playerId: "user-2", summary: "Bob a combattu vaillamment." },
          ],
        }),
      },
    },
  ],
});

describe("generateEpilogue()", () => {
  it("should return parsed epilogue and player summaries", async () => {
    mockCreate.mockResolvedValueOnce(
      mockEpilogueResponse(
        "La quête est terminée. La forêt est libérée.",
      ) as never,
    );

    const result = await generateEpilogue(epilogueInput);

    expect(result.epilogue).toBe(
      "La quête est terminée. La forêt est libérée.",
    );
    expect(result.playerSummaries["user-1"]).toBe(
      "Alice a sauvé le groupe grâce à sa magie.",
    );
    expect(result.playerSummaries["user-2"]).toBe(
      "Bob a combattu vaillamment.",
    );
  });

  it("should call OpenAI with epilogue_output schema", async () => {
    mockCreate.mockResolvedValueOnce(mockEpilogueResponse("Fin.") as never);

    await generateEpilogue(epilogueInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "epilogue_output",
            strict: true,
          }),
        }),
      }),
      expect.anything(),
    );
  });

  it("should include full history in epilogue messages", async () => {
    mockCreate.mockResolvedValueOnce(
      mockEpilogueResponse("Fin de l'aventure.") as never,
    );

    await generateEpilogue(epilogueInput);

    const [body] = mockCreate.mock.calls[0] as unknown as [
      { messages: { role: string; content: string }[] },
    ];
    const userMessages = body.messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages.at(-1);

    // Should include final instruction
    expect(lastUserMessage?.content).toContain("épilogue final");
    expect(lastUserMessage?.content).toContain("bilan personnalisé");

    // System prompt should mention conclusion
    const systemMessage = body.messages.find((m) => m.role === "system");
    expect(systemMessage?.content).toContain("épilogue");
    expect(systemMessage?.content).toContain("La forêt maudite");
    expect(systemMessage?.content).toContain("Alice");
  });

  it("should remap player names to IDs in summaries", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              epilogue: "Fin.",
              playerSummaries: [
                { playerId: "Alice", summary: "Alice a brillé." },
                { playerId: "Bob", summary: "Bob a combattu." },
              ],
            }),
          },
        },
      ],
    } as never);

    const result = await generateEpilogue(epilogueInput);

    expect(result.playerSummaries["user-1"]).toBe("Alice a brillé.");
    expect(result.playerSummaries["user-2"]).toBe("Bob a combattu.");
  });

  it("should retry once on failure", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockEpilogueResponse("Fin après retry.") as never);

    const result = await generateEpilogue(epilogueInput);

    expect(result.epilogue).toBe("Fin après retry.");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should throw after all retries exhausted", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockRejectedValueOnce(new Error("Timeout"));

    await expect(generateEpilogue(epilogueInput)).rejects.toThrow("Timeout");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
