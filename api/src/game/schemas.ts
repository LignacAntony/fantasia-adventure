import { z } from "zod";

export const gameIdParamsSchema = z.object({ id: z.string().uuid() });
export type GameIdParams = z.infer<typeof gameIdParamsSchema>;

export const addUserBodySchema = z.object({ username: z.string().min(1) });
export type AddUserBody = z.infer<typeof addUserBodySchema>;

export const createGameBodySchema = z.object({
  name: z.string().min(1),
  theme: z.string().min(1),
  totalSteps: z.number().int().min(5).max(15),
});
export type CreateGameBody = z.infer<typeof createGameBodySchema>;
