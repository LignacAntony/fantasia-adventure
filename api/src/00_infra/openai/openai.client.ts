import OpenAI from "openai";
import { envVariables } from "../env/envVariables.js";

export const openaiClient = new OpenAI({
  apiKey: envVariables.OPENAI_API_KEY,
});
