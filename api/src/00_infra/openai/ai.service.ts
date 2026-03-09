import { openaiClient } from "./openai.client.js";
import type { AiNarrationOutput, GenerateNarrationInput } from "./ai.types.js";
import { AVATARS } from "@/types/avatar.js";
import type { AvatarId } from "@/types/avatar.js";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

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

Si étape individuelle :
{
  "stepType": "individual",
  "narration": "texte de narration pour tous les joueurs",
  "suggestions": {
    "<playerId>": ["suggestion 1", "suggestion 2", "suggestion 3"]
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

    return JSON.parse(content) as AiNarrationOutput;
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
