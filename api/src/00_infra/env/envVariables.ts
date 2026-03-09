import dotenv from "dotenv";
import z from "zod";

dotenv.config({ path: ".env.local" });

const EnvVariablesSchema = z.object({
  /** Origines CORS autorisées, séparées par des virgules (sans slash final) */
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  /** Clé secrète OpenAI — ne jamais commiter */
  OPENAI_API_KEY: z.string().min(1),
  /** Mode mock : si "true", l'IA renvoie des données statiques (dev sans quota OpenAI) */
  MOCK_AI: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
const parsed = EnvVariablesSchema.parse({
  FRONTEND_URL: process.env.FRONTEND_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MOCK_AI: process.env.MOCK_AI,
});

const toOrigin = (s: string) => s.trim().replace(/\/$/, "");
export const envVariables = {
  ...parsed,
  /** Liste d’origines pour CORS (sans slash final) */
  CORS_ORIGINS: parsed.FRONTEND_URL.split(",")
    .map(toOrigin)
    .filter((o) => o.length > 0),
};
