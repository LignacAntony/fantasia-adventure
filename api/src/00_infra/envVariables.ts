import dotenv from "dotenv";
import z from "zod";

dotenv.config({ path: ".env.local" });

const EnvVariablesSchema = z.object({
  FRONTEND_URL: z.string(),
});
export const envVariables = EnvVariablesSchema.parse({
  FRONTEND_URL: process.env.FRONTEND_URL,
});
