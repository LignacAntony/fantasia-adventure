import * as z from "zod";

const envVariablesList = {
  FRONTEND_URL: process.env.FRONTEND_URL,
};

const envVariablesSchema = z.object({
  FRONTEND_URL: z.string(),
});

export const envVariables = envVariablesSchema.parse(envVariablesList);
