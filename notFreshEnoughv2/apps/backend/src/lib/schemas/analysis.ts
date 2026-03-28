import { z } from "zod";
import { ArtifactTypeSchema, SeveritySchema, SignalSchema, SurfaceStatusSchema, SurfaceTypeSchema } from "./tinyfish";

export const AnalysisPointSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: SeveritySchema,
  evidenceIds: z.array(z.string()).default([])
});

export const AnalysisEvidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  signal: SignalSchema,
  sourceIds: z.array(z.string()).default([]),
  excerpt: z.string().optional()
});

export const AnalysisSourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  surfaceType: SurfaceTypeSchema,
  status: SurfaceStatusSchema,
  url: z.string().url().optional()
});

export const AnalysisScoresSchema = z.object({
  clarity: z.number().min(1).max(10),
  completeness: z.number().min(1).max(10),
  differentiation: z.number().min(1).max(10),
  usability: z.number().min(1).max(10),
  technicalDepth: z.number().min(1).max(10),
  freshness: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  overallGrade: z.enum(["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"])
});

export const SharedProjectAnalysisSchema = z.object({
  projectName: z.string(),
  summary: z.string(),
  sourcesInspected: z.array(AnalysisSourceSchema).min(1),
  strongPoints: z.array(AnalysisPointSchema).min(1).max(5),
  weakPoints: z.array(AnalysisPointSchema).min(1).max(6),
  missingElements: z.array(AnalysisPointSchema).max(5),
  judgeConcerns: z.array(AnalysisPointSchema).min(1).max(5),
  evidence: z.array(AnalysisEvidenceSchema).min(1).max(12),
  scores: AnalysisScoresSchema,
  bestArtifactToRefurbish: z.object({
    artifactType: ArtifactTypeSchema,
    reason: z.string(),
    sourceSnippet: z.string().optional()
  }),
  freshnessNarrative: z.string()
});

export type AnalysisPoint = z.infer<typeof AnalysisPointSchema>;
export type SharedProjectAnalysis = z.infer<typeof SharedProjectAnalysisSchema>;
