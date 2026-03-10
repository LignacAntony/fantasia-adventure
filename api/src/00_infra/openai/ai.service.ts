import { openaiClient } from "./openai.client.js";
import type { AiNarrationOutput, GenerateNarrationInput } from "./ai.types.js";
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
            required: ["playerId", "options"] as const,
            additionalProperties: false,
            properties: {
              playerId: { type: "string" as const },
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
  suggestions: Array<{ playerId: string; options: string[] }> | null;
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Remap suggestion keys to player IDs.
 * The AI sometimes uses player names instead of UUIDs despite the schema.
 */
function normalizeSuggestionKeys(
  raw: Record<string, string[]>,
  players: Array<{ id: string; username: string }>,
): Record<string, string[]> {
  const playerIds = new Set(players.map((p) => p.id));

  // Fast path: all keys are already valid player IDs
  if (Object.keys(raw).every((k) => playerIds.has(k))) return raw;

  console.warn(
    "[AiService] Suggestion keys don't match player IDs — remapping",
  );
  const normalized: Record<string, string[]> = {};

  for (const [key, suggestions] of Object.entries(raw)) {
    if (!Array.isArray(suggestions)) continue;

    // Exact ID match (partial hits)
    if (playerIds.has(key)) {
      normalized[key] = suggestions;
      continue;
    }

    // Match by username (case-insensitive)
    const match = players.find(
      (p) => p.username.toLowerCase() === key.toLowerCase(),
    );
    if (match && !normalized[match.id]) {
      normalized[match.id] = suggestions;
    }
  }

  // Last resort: if AI returned the right count but wrong keys, assign positionally
  const rawEntries = Object.entries(raw).filter(([, v]) => Array.isArray(v));
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

TYPE D'ÉTAPE — tu choisis le plus cohérent avec la situation narrative :
- "collective" : situation de groupe (exploration, décision narrative commune, obstacle partagé).
  → Fournis 3 options dans "choices", rédigées à la 1ère personne du pluriel (ex: "Nous...").
  → Mets "suggestions" à null.
- "individual" : situation où chaque joueur agit selon ses propres capacités (combat, rencontre solo, événement personnel).
  → Fournis "suggestions" avec exactement 3 options PAR joueur, adaptées à son avatar.
  → Les suggestions DOIVENT être différentes entre les joueurs.
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
  "narration": "texte de narration",
  "choices": null,
  "suggestions": [
    ${input.players.map((p) => `{ "playerId": "${p.id}", "options": ["action 1 pour ${p.username}", "action 2", "action 3"] }`).join(",\n    ")}
  ]
}`;
}

function buildMessages(input: GenerateNarrationInput) {
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  for (const entry of input.history) {
    messages.push({
      role: "assistant",
      content: JSON.stringify({
        stepType: entry.stepType,
        narration: entry.narration,
      }),
    });

    const choicesSummary = entry.choices
      .map((c) => `${c.playerName} (${c.avatar}) : ${c.choice}`)
      .join("\n");

    const uniqueVotes = [
      ...new Set(
        entry.choices.map((c) => c.choice).filter((c) => c !== "(pas de vote)"),
      ),
    ];
    const synthesisNote =
      entry.stepType === "collective" && uniqueVotes.length > 1
        ? "\n(Votes divergents — synthétise les décisions en une narration cohérente qui reflète la majorité.)"
        : "";

    messages.push({
      role: "user",
      content: `Choix des joueurs :\n${choicesSummary}${synthesisNote}\n\nGénère la narration pour l'étape suivante.`,
    });
  }

  if (input.history.length === 0) {
    messages.push({
      role: "user",
      content: `Génère le contexte narratif initial : description du monde, situation de départ et objectif commun. C'est l'étape 1/${input.totalSteps}.`,
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

    // Transform array-of-objects → Record<string, string[]>
    const suggestionsRecord: Record<string, string[]> = {};
    for (const entry of raw.suggestions) {
      suggestionsRecord[entry.playerId] = entry.options;
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
