import type { ZodSchema } from "zod";
import type { OpenAiClient } from "../openai/client";
import { generateJsonCompletion } from "../openai/jsonCompletion";
import {
  AhGongVerdictSchema,
  AuntyQuestionsSchema,
  KorkorRecommendationsSchema,
  KorkorRefurbishedProjectSchema
} from "../schemas/personas";
import type { PersonaEnvelope } from "../schemas/response";
import type { SharedProjectAnalysis } from "../schemas/analysis";
import { buildAuntyUserPrompt, auntySystemPrompt } from "../prompts/personas/auntyPrompt";
import { ahGongSystemPrompt, buildAhGongUserPrompt } from "../prompts/personas/ahGongPrompt";
import {
  buildKorkorRecommendationsUserPrompt,
  korkorRecommendationsSystemPrompt
} from "../prompts/personas/korkorRecommendationsPrompt";
import {
  buildKorkorRefurbishedUserPrompt,
  korkorRefurbishedSystemPrompt
} from "../prompts/personas/korkorRefurbishedPrompt";
import { buildAhGongFallback, buildAuntyFallback, buildRecommendationsFallback, buildRefurbishedFallback } from "./fallbacks";
import type { PersonaFocusPlan } from "./focusAllocator";

async function runPersona<T>({
  client,
  model,
  schema,
  systemPrompt,
  userPrompt,
  fallback
}: {
  client: OpenAiClient | null;
  model: string;
  schema: ZodSchema<T>;
  systemPrompt: string;
  userPrompt: string;
  fallback: () => T;
}): Promise<PersonaEnvelope<T>> {
  if (!client) {
    return {
      status: "ok",
      source: "fallback",
      data: fallback()
    };
  }

  try {
    const data = await generateJsonCompletion({
      client,
      model,
      schema,
      systemPrompt,
      userPrompt,
      temperature: 0.5
    });

    return {
      status: "ok",
      source: "llm",
      data
    };
  } catch (error) {
    try {
      return {
        status: "ok",
        source: "fallback",
        data: fallback()
      };
    } catch {
      return {
        status: "error",
        error: {
          message: (error as Error).message
        }
      };
    }
  }
}

export async function generateFamilyPanel(args: {
  analysis: SharedProjectAnalysis;
  focusPlan: PersonaFocusPlan;
  client: OpenAiClient | null;
  model: string;
}) {
  const { analysis, focusPlan, client, model } = args;

  const [aunty, ahGong, korkorRecommendations, korkorRefurbished] = await Promise.all([
    runPersona({
      client,
      model,
      schema: AuntyQuestionsSchema,
      systemPrompt: auntySystemPrompt,
      userPrompt: buildAuntyUserPrompt(analysis, focusPlan),
      fallback: () => buildAuntyFallback(analysis, focusPlan)
    }),
    runPersona({
      client,
      model,
      schema: AhGongVerdictSchema,
      systemPrompt: ahGongSystemPrompt,
      userPrompt: buildAhGongUserPrompt(analysis, focusPlan),
      fallback: () => buildAhGongFallback(analysis, focusPlan)
    }),
    runPersona({
      client,
      model,
      schema: KorkorRecommendationsSchema,
      systemPrompt: korkorRecommendationsSystemPrompt,
      userPrompt: buildKorkorRecommendationsUserPrompt(analysis, focusPlan),
      fallback: () => buildRecommendationsFallback(analysis, focusPlan)
    }),
    runPersona({
      client,
      model,
      schema: KorkorRefurbishedProjectSchema,
      systemPrompt: korkorRefurbishedSystemPrompt,
      userPrompt: buildKorkorRefurbishedUserPrompt(analysis, focusPlan),
      fallback: () => buildRefurbishedFallback(analysis, focusPlan)
    })
  ]);

  return {
    aunty,
    ahGong,
    korkorRecommendations,
    korkorRefurbished
  };
}
