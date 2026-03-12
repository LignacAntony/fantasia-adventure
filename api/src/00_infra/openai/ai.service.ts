import { openaiClient } from "./openai.client.js";
import type {
  AiEpilogueOutput,
  AiNarrationOutput,
  GenerateEpilogueInput,
  GenerateNarrationInput,
  PlayerSuggestion,
} from "./ai.types.js";
import { recordUsage } from "./usage.tracker.js";
import { AVATARS } from "@/types/avatar.js";
import type { AvatarId } from "@/types/avatar.js";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 120_000;
const MAX_RETRIES = 1;

// ─── Structured Outputs JSON Schema ────────────────────────────────

const NARRATION_SCHEMA = {
  type: "object" as const,
  required: ["stepType", "narration", "choices", "suggestions"] as const,
  additionalProperties: false,
  properties: {
    stepType: {
      type: "string" as const,
      enum: ["collective", "individual"],
    },
    narration: {
      type: "string" as const,
    },
    choices: {
      anyOf: [
        { type: "array" as const, items: { type: "string" as const } },
        { type: "null" as const },
      ],
    },
    suggestions: {
      anyOf: [
        {
          type: "array" as const,
          items: {
            type: "object" as const,
            required: ["playerId", "situation", "options"] as const,
            additionalProperties: false,
            properties: {
              playerId: { type: "string" as const },
              situation: { type: "string" as const },
              options: {
                type: "array" as const,
                items: { type: "string" as const },
              },
            },
          },
        },
        { type: "null" as const },
      ],
    },
  },
};

/** Shape returned directly by the AI (flat, nullable fields). */
interface RawAiResponse {
  stepType: "collective" | "individual";
  narration: string;
  choices: string[] | null;
  suggestions: Array<{
    playerId: string;
    situation: string;
    options: string[];
  }> | null;
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Remap suggestion keys to player IDs.
 * The AI sometimes uses player names instead of UUIDs despite the schema.
 */
function normalizeSuggestionKeys(
  raw: Record<string, PlayerSuggestion>,
  players: Array<{ id: string; username: string }>,
): Record<string, PlayerSuggestion> {
  const playerIds = new Set(players.map((p) => p.id));

  // Fast path: all keys are already valid player IDs
  if (Object.keys(raw).every((k) => playerIds.has(k))) return raw;

  console.warn(
    "[AiService] Suggestion keys don't match player IDs — remapping",
  );
  const normalized: Record<string, PlayerSuggestion> = {};

  for (const [key, suggestion] of Object.entries(raw)) {
    // Exact ID match (partial hits)
    if (playerIds.has(key)) {
      normalized[key] = suggestion;
      continue;
    }

    // Match by username (case-insensitive)
    const match = players.find(
      (p) => p.username.toLowerCase() === key.toLowerCase(),
    );
    if (match && !normalized[match.id]) {
      normalized[match.id] = suggestion;
    }
  }

  // Last resort: if AI returned the right count but wrong keys, assign positionally
  const rawEntries = Object.entries(raw);
  if (
    Object.keys(normalized).length === 0 &&
    rawEntries.length === players.length
  ) {
    for (let i = 0; i < players.length; i++) {
      normalized[players[i]!.id] = rawEntries[i]![1];
    }
  }

  return normalized;
}

// ─── Prompt building ───────────────────────────────────────────────

function buildSystemPrompt(input: GenerateNarrationInput): string {
  const playerList = input.players
    .map((p) => {
      const avatarData = AVATARS[p.avatar as AvatarId];
      const label = avatarData
        ? `${avatarData.name} — ${avatarData.archetype}`
        : p.avatar;
      const instruction = avatarData?.systemPrompt ?? "";
      return `- ${p.username} [ID: ${p.id}] (${label})\n  → ${instruction}`;
    })
    .join("\n");

  return `Tu es le Maître du Jeu d'une aventure de fantasy pour ${input.players.length} joueur(s). Tu génères une narration immersive et des suggestions d'actions adaptées à chaque joueur.

RÈGLES GÉNÉRALES :
- Langue : français uniquement
- Ton : épique, immersif, cohérent avec les événements passés
- Ne jamais contredire l'historique narratif
- Contenu approprié uniquement (pas de violence extrême ni contenu adulte)
- Interdiction de reproduire des personnages, lieux ou intrigues d'œuvres existantes
- Faire avancer l'histoire à chaque étape, ne pas tourner en rond

TYPE D'ÉTAPE — règle d'ALTERNANCE OBLIGATOIRE :
- Alterne systématiquement entre "collective" et "individual" à chaque étape.
- Si la dernière étape générée était "collective" → tu DOIS choisir "individual".
- Si la dernière étape générée était "individual" → tu DOIS choisir "collective".
- Étape 1 (pas d'historique) : commence par "collective".
- Le message de l'utilisateur indique également le type attendu — tu dois le respecter.

- "collective" : situation de groupe (exploration, décision narrative commune, obstacle partagé).
  → Fournis 3 options dans "choices", rédigées à la 1ère personne du pluriel (ex: "Nous...").
  → Mets "suggestions" à null.
  → Si l'étape précédente était "individual" : la narration DOIT synthétiser les actions de chaque joueur et montrer comment elles ont convergé pour faire évoluer la situation commune du groupe.
- "individual" : situation où chaque joueur vit une micro-situation UNIQUE selon son rôle (combat, rencontre solo, marchand, événement personnel).
  → Pour chaque joueur, fournis :
    - "situation" : 1-2 phrases décrivant la scène personnelle vécue par CE joueur (distincte des autres).
    - "options" : exactement 3 actions différentes adaptées à son avatar et sa situation.
  → Les situations ET les options doivent être UNIQUES et différentes entre les joueurs.
  → Mets "choices" à null.

Ne mets JAMAIS les options dans la narration ; elles doivent être UNIQUEMENT dans "choices" ou "suggestions".

JOUEURS :
${playerList}

THÈME : ${input.theme}
ÉTAPES TOTALES : ${input.totalSteps}
ÉTAPE ACTUELLE : ${input.currentStep}/${input.totalSteps}

FORMAT DE RÉPONSE — le schéma JSON est imposé automatiquement. Exemples :

Étape collective :
{
  "stepType": "collective",
  "narration": "texte de narration",
  "choices": ["Nous explorons la grotte", "Nous contournons la montagne", "Nous demandons l'aide du sage"],
  "suggestions": null
}

Étape individuelle :
{
  "stepType": "individual",
  "narration": "texte de narration commun au groupe",
  "choices": null,
  "suggestions": [
    ${input.players.map((p) => `{ "playerId": "${p.id}", "situation": "micro-situation unique pour ${p.username}", "options": ["action 1 pour ${p.username}", "action 2", "action 3"] }`).join(",\n    ")}
  ]
}`;
}

function buildMessages(input: GenerateNarrationInput) {
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  for (let i = 0; i < input.history.length; i++) {
    const entry = input.history[i]!;

    messages.push({
      role: "assistant",
      content: JSON.stringify({
        stepType: entry.stepType,
        narration: entry.narration,
      }),
    });

    // Format choices differently for individual vs collective steps
    let choicesSummary: string;
    if (entry.stepType === "individual") {
      // Include per-player micro-situation so the AI can synthesize impacts
      choicesSummary = entry.choices
        .map((c) => {
          const situationLine = c.situation
            ? `\n  situation : "${c.situation}"`
            : "";
          return `${c.playerName} (${c.avatar}) :${situationLine}\n  action choisie : "${c.choice}"`;
        })
        .join("\n");
    } else {
      choicesSummary = entry.choices
        .map((c) => `${c.playerName} (${c.avatar}) : ${c.choice}`)
        .join("\n");
    }

    const uniqueVotes = [
      ...new Set(
        entry.choices.map((c) => c.choice).filter((c) => c !== "(pas de vote)"),
      ),
    ];
    const synthesisNote =
      entry.stepType === "collective" && uniqueVotes.length > 1
        ? "\n(Votes divergents — synthétise les décisions en une narration cohérente qui reflète la majorité.)"
        : "";

    // On the last history entry, add an explicit alternation hint for the AI
    const isLastEntry = i === input.history.length - 1;
    const nextStepType =
      entry.stepType === "collective" ? "individual" : "collective";
    const alternationHint = isLastEntry
      ? entry.stepType === "individual"
        ? `\n\n[ALTERNANCE OBLIGATOIRE : étape précédente = "individual" → génère impérativement une étape "${nextStepType}". La narration doit synthétiser les actions individuelles ci-dessus et montrer leur impact convergent sur la situation commune du groupe.]`
        : `\n\n[ALTERNANCE OBLIGATOIRE : étape précédente = "collective" → génère impérativement une étape "${nextStepType}".]`
      : "";

    const userLabel =
      entry.stepType === "individual"
        ? "Résultats des actions individuelles"
        : "Choix des joueurs";

    messages.push({
      role: "user",
      content: `${userLabel} :\n${choicesSummary}${synthesisNote}\n\nGénère la narration pour l'étape suivante.${alternationHint}`,
    });
  }

  if (input.history.length === 0) {
    messages.push({
      role: "user",
      content: `Génère le contexte narratif initial : description du monde, situation de départ et objectif commun. C'est l'étape 1/${input.totalSteps}.\n\n[TYPE D'ÉTAPE : commence par "collective" pour établir le contexte commun du groupe.]`,
    });
  }

  return messages;
}

// ─── OpenAI call with Structured Outputs ───────────────────────────

async function callOpenAi(
  input: GenerateNarrationInput,
): Promise<AiNarrationOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await openaiClient.chat.completions.create(
      {
        model: MODEL,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "narration_output",
            strict: true,
            schema: NARRATION_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: buildSystemPrompt(input) },
          ...buildMessages(input),
        ],
      },
      { signal: controller.signal },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("[AiService] Empty response from OpenAI");

    if (response.usage) {
      recordUsage(
        "narration",
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
      );
    }

    const raw = JSON.parse(content) as RawAiResponse;

    // ── Collective step ──
    if (raw.stepType === "collective") {
      if (!Array.isArray(raw.choices) || raw.choices.length === 0) {
        throw new Error(
          `[AiService] Collective step but choices is ${JSON.stringify(raw.choices)}`,
        );
      }
      return {
        stepType: "collective",
        narration: raw.narration,
        choices: raw.choices,
      };
    }

    // ── Individual step ──
    if (!Array.isArray(raw.suggestions) || raw.suggestions.length === 0) {
      throw new Error(
        `[AiService] Individual step but suggestions is ${JSON.stringify(raw.suggestions)}`,
      );
    }

    const suggestionsRecord: Record<string, PlayerSuggestion> = {};
    for (const entry of raw.suggestions) {
      suggestionsRecord[entry.playerId] = {
        situation: entry.situation,
        options: entry.options,
      };
    }

    const suggestions = normalizeSuggestionKeys(
      suggestionsRecord,
      input.players,
    );
    return { stepType: "individual", narration: raw.narration, suggestions };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Génère une narration IA pour l'étape courante.
 * Effectue une seconde tentative automatique en cas d'échec.
 * Lève une erreur si les deux tentatives échouent (FAN-45).
 */
export async function generateNarration(
  input: GenerateNarrationInput,
): Promise<AiNarrationOutput> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOpenAi(input);
    } catch (error) {
      lastError = error;
      console.error(`[AiService] Tentative ${attempt + 1} échouée :`, error);
      if (attempt < MAX_RETRIES) {
        console.log("[AiService] Nouvelle tentative...");
      }
    }
  }

  throw lastError;
}

// ─── Épilogue (FAN-75 / FAN-77) ─────────────────────────────────────

const EPILOGUE_SCHEMA = {
  type: "object" as const,
  required: ["epilogue", "playerSummaries"] as const,
  additionalProperties: false,
  properties: {
    epilogue: { type: "string" as const },
    playerSummaries: {
      type: "array" as const,
      items: {
        type: "object" as const,
        required: ["playerId", "summary"] as const,
        additionalProperties: false,
        properties: {
          playerId: { type: "string" as const },
          summary: { type: "string" as const },
        },
      },
    },
  },
};

interface RawEpilogueResponse {
  epilogue: string;
  playerSummaries: Array<{ playerId: string; summary: string }>;
}

function buildEpilogueSystemPrompt(input: GenerateEpilogueInput): string {
  const playerList = input.players
    .map((p) => {
      const avatarData = AVATARS[p.avatar as AvatarId];
      const label = avatarData
        ? `${avatarData.name} — ${avatarData.archetype}`
        : p.avatar;
      return `- ${p.username} [ID: ${p.id}] (${label})`;
    })
    .join("\n");

  return `Tu es le Maître du Jeu d'une aventure de fantasy. L'aventure est maintenant terminée. Tu dois rédiger un épilogue narratif qui conclut l'histoire et un bilan personnalisé pour chaque joueur.

RÈGLES :
- Langue : français uniquement
- Ton : épique, conclusif, satisfaisant — donne le sentiment d'une quête accomplie
- L'épilogue doit résumer les moments clés de l'aventure et les conséquences des choix collectifs et individuels
- Chaque bilan de joueur doit être personnel : mentionne ses actions marquantes, son rôle dans le groupe, et ce que son personnage devient après l'aventure
- 3-5 phrases pour l'épilogue, 2-3 phrases par bilan joueur
- Ne jamais contredire l'historique narratif
- Contenu approprié uniquement

JOUEURS :
${playerList}

THÈME : ${input.theme}
NOMBRE D'ÉTAPES : ${input.totalSteps}`;
}

function buildEpilogueMessages(input: GenerateEpilogueInput) {
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  // Replay the full history so the AI has context
  for (const entry of input.history) {
    messages.push({
      role: "assistant",
      content: JSON.stringify({
        stepType: entry.stepType,
        narration: entry.narration,
      }),
    });

    let choicesSummary: string;
    if (entry.stepType === "individual") {
      choicesSummary = entry.choices
        .map((c) => {
          const situationLine = c.situation
            ? `\n  situation : "${c.situation}"`
            : "";
          return `${c.playerName} (${c.avatar}) :${situationLine}\n  action choisie : "${c.choice}"`;
        })
        .join("\n");
    } else {
      choicesSummary = entry.choices
        .map((c) => `${c.playerName} (${c.avatar}) : ${c.choice}`)
        .join("\n");
    }

    const userLabel =
      entry.stepType === "individual"
        ? "Résultats des actions individuelles"
        : "Choix des joueurs";

    messages.push({
      role: "user",
      content: `${userLabel} :\n${choicesSummary}`,
    });
  }

  // Final instruction asking for the epilogue
  messages.push({
    role: "user",
    content: `L'aventure est terminée après ${input.totalSteps} étapes. Génère maintenant l'épilogue final et le bilan personnalisé de chaque joueur en te basant sur l'intégralité de l'historique ci-dessus.`,
  });

  return messages;
}

async function callOpenAiEpilogue(
  input: GenerateEpilogueInput,
): Promise<AiEpilogueOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await openaiClient.chat.completions.create(
      {
        model: MODEL,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "epilogue_output",
            strict: true,
            schema: EPILOGUE_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: buildEpilogueSystemPrompt(input) },
          ...buildEpilogueMessages(input),
        ],
      },
      { signal: controller.signal },
    );

    const content = response.choices[0]?.message?.content;
    if (!content)
      throw new Error("[AiService] Empty epilogue response from OpenAI");

    if (response.usage) {
      recordUsage(
        "epilogue",
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
      );
    }

    const raw = JSON.parse(content) as RawEpilogueResponse;

    if (!raw.epilogue || typeof raw.epilogue !== "string") {
      throw new Error("[AiService] Epilogue text is missing");
    }
    if (!Array.isArray(raw.playerSummaries)) {
      throw new Error("[AiService] playerSummaries is not an array");
    }

    // Convert array to Record<playerId, summary>
    const summaries: Record<string, string> = {};
    for (const entry of raw.playerSummaries) {
      summaries[entry.playerId] = entry.summary;
    }

    // Normalize keys (AI may use names instead of UUIDs)
    const playerIds = new Set(input.players.map((p) => p.id));
    const needsRemap = !Object.keys(summaries).every((k) => playerIds.has(k));

    if (needsRemap) {
      console.warn(
        "[AiService] Epilogue summary keys don't match player IDs — remapping",
      );
      const remapped: Record<string, string> = {};
      const entries = Object.entries(summaries);

      for (const [key, summary] of entries) {
        if (playerIds.has(key)) {
          remapped[key] = summary;
          continue;
        }
        const match = input.players.find(
          (p) => p.username.toLowerCase() === key.toLowerCase(),
        );
        if (match && !remapped[match.id]) {
          remapped[match.id] = summary;
        }
      }

      // Positional fallback
      if (
        Object.keys(remapped).length === 0 &&
        entries.length === input.players.length
      ) {
        for (let i = 0; i < input.players.length; i++) {
          remapped[input.players[i]!.id] = entries[i]![1];
        }
      }

      return { epilogue: raw.epilogue, playerSummaries: remapped };
    }

    return { epilogue: raw.epilogue, playerSummaries: summaries };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Génère l'épilogue final de l'aventure.
 * Effectue une seconde tentative automatique en cas d'échec.
 */
export async function generateEpilogue(
  input: GenerateEpilogueInput,
): Promise<AiEpilogueOutput> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOpenAiEpilogue(input);
    } catch (error) {
      lastError = error;
      console.error(
        `[AiService] Epilogue tentative ${attempt + 1} échouée :`,
        error,
      );
      if (attempt < MAX_RETRIES) {
        console.log("[AiService] Nouvelle tentative épilogue...");
      }
    }
  }

  throw lastError;
}
