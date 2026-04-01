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
import type { AuntyQuestions, KorkorRecommendations } from "../schemas/personas";
import { enforceAhGongVerdict } from "./familyTone";

function normalizeCopy(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function countJudgeItems(values: string[]) {
  return values.filter((value) => /\bjudge|judges|orientation\b/i.test(value)).length;
}

function isValidAuntyPayload(data: AuntyQuestions) {
  const normalized = data.questions.map(normalizeCopy);
  return new Set(normalized).size === 3 && countJudgeItems(data.questions) <= 1;
}

function recommendationSignature(recommendation: KorkorRecommendations["recommendations"][number]) {
  return normalizeCopy(`${recommendation.issue} ${recommendation.whyItMatters} ${recommendation.concreteAction}`);
}

function isValidRecommendationsPayload(data: KorkorRecommendations) {
  return (
    new Set(data.recommendations.map(recommendationSignature)).size === 3 &&
    countJudgeItems(
      data.recommendations.map(
        (recommendation) => `${recommendation.issue} ${recommendation.whyItMatters} ${recommendation.concreteAction}`
      )
    ) <= 1
  );
}

async function runPersona<T>({
  client,
  model,
  schema,
  systemPrompt,
  userPrompt,
  fallback,
  validate
}: {
  client: OpenAiClient | null;
  model: string;
  schema: ZodSchema<T>;
  systemPrompt: string;
  userPrompt: string;
  fallback: () => T;
  validate?: (data: T) => boolean;
}): Promise<PersonaEnvelope<T>> {
  if (!client) {
    return {
      status: "ok",
      source: "fallback",
      data: fallback()
    };
  }

  try {
    const attempt = async (prompt: string) =>
      generateJsonCompletion({
        client,
        model,
        schema,
        systemPrompt,
        userPrompt: prompt,
        temperature: 0.5
      });

    let data = await attempt(userPrompt);

    if (validate && !validate(data)) {
      data = await attempt(`${userPrompt}\n\nMake them distinct.`);
      if (!validate(data)) {
        throw new Error("Generated persona output was repetitive.");
      }
    }

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
      fallback: () => buildAuntyFallback(analysis, focusPlan),
      validate: isValidAuntyPayload
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
      fallback: () => buildRecommendationsFallback(analysis, focusPlan),
      validate: isValidRecommendationsPayload
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
    ahGong:
      ahGong.status === "ok"
        ? {
            ...ahGong,
            data: enforceAhGongVerdict(ahGong.data, analysis.scores.overallGrade, analysis, focusPlan)
          }
        : ahGong,
    korkorRecommendations,
    korkorRefurbished
  };
}
