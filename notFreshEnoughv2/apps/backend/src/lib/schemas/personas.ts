import { z } from "zod";
import { ArtifactTypeSchema } from "./tinyfish";

export const VerdictSchema = z.enum(["Borderline", "Jialat", "Siao Liao"]);

export const AuntyQuestionsSchema = z.object({
  questions: z.array(z.string()).length(3)
});

export const AhGongVerdictSchema = z.object({
  verdict: VerdictSchema,
  explanation: z.string(),
  closingLine: z.string()
});

export const KorkorRecommendationsSchema = z.object({
  recommendations: z
    .array(
      z.object({
        priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        issue: z.string(),
        whyItMatters: z.string(),
        concreteAction: z.string()
      })
    )
    .length(3)
});

export const KorkorRefurbishedProjectSchema = z.object({
  artifactType: ArtifactTypeSchema,
  reason: z.string(),
  title: z.string(),
  content: z.string()
});

export type AuntyQuestions = z.infer<typeof AuntyQuestionsSchema>;
export type AhGongVerdict = z.infer<typeof AhGongVerdictSchema>;
export type KorkorRecommendations = z.infer<typeof KorkorRecommendationsSchema>;
export type KorkorRefurbishedProject = z.infer<typeof KorkorRefurbishedProjectSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
