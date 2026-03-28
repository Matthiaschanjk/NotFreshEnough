import { z } from "zod";
import { SharedProjectAnalysisSchema } from "./analysis";
import {
  AhGongVerdictSchema,
  AuntyQuestionsSchema,
  KorkorRecommendationsSchema,
  KorkorRefurbishedProjectSchema
} from "./personas";

const PersonaErrorSchema = z.object({
  message: z.string()
});

const createPersonaEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(["ok", "error"]),
    source: z.enum(["llm", "fallback"]).optional(),
    data: dataSchema.optional(),
    error: PersonaErrorSchema.optional()
  });

export const JudgeProjectResponseSchema = z.object({
  requestId: z.string(),
  generatedAt: z.string(),
  inputEcho: z.object({
    repoUrl: z.string().url(),
    demoUrl: z.string().url().optional(),
    submissionUrl: z.string().url().optional(),
    projectBlurb: z.string().optional()
  }),
  analysis: SharedProjectAnalysisSchema,
  tinyFish: z.object({
    investigationMode: z.enum(["mock", "sdk"]),
    warnings: z.array(z.string()).default([]),
    sourcesInspected: z.number().int().positive()
  }),
  panel: z.object({
    familyHeadline: z.string(),
    statusLabel: z.enum(["PASS", "FAIL"]),
    aunty: createPersonaEnvelopeSchema(AuntyQuestionsSchema),
    ahGong: createPersonaEnvelopeSchema(AhGongVerdictSchema),
    korkorRecommendations: createPersonaEnvelopeSchema(KorkorRecommendationsSchema),
    korkorRefurbished: createPersonaEnvelopeSchema(KorkorRefurbishedProjectSchema)
  })
});

export type JudgeProjectResponse = z.infer<typeof JudgeProjectResponseSchema>;

export interface PersonaEnvelope<T> {
  status: "ok" | "error";
  source?: "llm" | "fallback";
  data?: T;
  error?: {
    message: string;
  };
}
