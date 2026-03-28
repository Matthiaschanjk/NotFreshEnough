import OpenAI from "openai";
import type { Env } from "../../config/env";

export function createOpenAiClient(env: Env) {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL
  });
}

export type OpenAiClient = NonNullable<ReturnType<typeof createOpenAiClient>>;
