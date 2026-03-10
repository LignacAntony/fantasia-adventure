import { openaiClient } from "./openai.client.js";
import type { AiNarrationOutput, GenerateNarrationInput } from "./ai.types.js";
import { AVATARS } from "@/types/avatar.js";
import type { AvatarId } from "@/types/avatar.js";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

/**
 * Remap suggestion keys to player IDs.
 * The AI sometimes uses player names instead of UUIDs despite the prompt.
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
  → Génère un seul tableau "choices" de 3 options rédigées à la 1ère personne du pluriel (ex: "Nous...").
- "individual" : situation où chaque joueur agit selon ses propres capacités (combat, rencontre solo, événement personnel).
  → Génère "suggestions" avec exactement 3 options PAR joueur, adaptées à son avatar et son archétype.
  → Les suggestions DOIVENT être différentes entre les joueurs : chaque joueur a des options uniques qui reflètent ses avantages et inconvénients.

JOUEURS :
${playerList}

THÈME : ${input.theme}
ÉTAPES TOTALES : ${input.totalSteps}
ÉTAPE ACTUELLE : ${input.currentStep}/${input.totalSteps}

FORMAT DE RÉPONSE (JSON strict, aucun texte en dehors) :

Si étape collective :
{
  "stepType": "collective",
  "narration": "texte de narration pour tous les joueurs",
  "choices": ["option 1 (nous...)", "option 2 (nous...)", "option 3 (nous...)"]
}

Si étape individuelle (les clés de "suggestions" DOIVENT être les IDs des joueurs ci-dessus, PAS leurs noms) :
{
  "stepType": "individual",
  "narration": "texte de narration pour tous les joueurs",
  "suggestions": {
    ${input.players.map((p) => `"${p.id}": ["suggestion pour ${p.username} 1", "suggestion 2", "suggestion 3"]`).join(",\n    ")}
  }
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

    messages.push({
      role: "user",
      content: `Choix des joueurs :\n${choicesSummary}\n\nGénère la narration pour l'étape suivante.`,
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

async function callOpenAi(
  input: GenerateNarrationInput,
): Promise<AiNarrationOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await openaiClient.chat.completions.create(
      {
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(input) },
          ...buildMessages(input),
        ],
      },
      { signal: controller.signal },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("[AiService] Empty response from OpenAI");

    const parsed = JSON.parse(content) as Record<string, unknown>;

    const narration = parsed.narration as string;

    if (parsed.stepType === "collective" && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      return { stepType: "collective", narration, choices: parsed.choices as string[] };
    }

    // Fallback to individual — covers:
    // - explicit stepType "individual"
    // - missing stepType
    // - collective with wrong field (AI used "suggestions" instead of "choices")
    if (parsed.stepType === "collective") {
      console.warn("[AiService] collective step missing choices — falling back to individual");
    }
    const rawSuggestions =
      parsed.suggestions != null &&
      typeof parsed.suggestions === "object" &&
      !Array.isArray(parsed.suggestions)
        ? (parsed.suggestions as Record<string, string[]>)
        : {};
    const suggestions = normalizeSuggestionKeys(rawSuggestions, input.players);
    return { stepType: "individual", narration, suggestions };
  } finally {
    clearTimeout(timer);
  }
}

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
