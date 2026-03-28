import { z } from "zod";

export const SurfaceTypeSchema = z.enum([
  "repo",
  "readme",
  "demo",
  "submission",
  "project-blurb",
  "docs"
]);

export const SurfaceStatusSchema = z.enum(["ok", "partial", "failed", "skipped"]);
export const FindingCategorySchema = z.enum([
  "clarity",
  "completeness",
  "differentiation",
  "usability",
  "technical-depth",
  "freshness",
  "proof",
  "consistency"
]);
export const SeveritySchema = z.enum(["low", "medium", "high"]);
export const SignalSchema = z.enum(["positive", "negative", "neutral"]);
export const ArtifactTypeSchema = z.enum([
  "README intro",
  "landing page hero section",
  "30-second demo pitch",
  "what judges should know section",
  "project summary"
]);

export const TinyFishSurfaceSchema = z.object({
  id: z.string(),
  surfaceType: SurfaceTypeSchema,
  label: z.string(),
  url: z.string().url().optional(),
  status: SurfaceStatusSchema,
  title: z.string().optional(),
  textContent: z.string().optional(),
  snippet: z.string().optional(),
  notes: z.array(z.string()).default([])
});

export const TinyFishFindingSchema = z.object({
  id: z.string(),
  category: FindingCategorySchema,
  signal: SignalSchema,
  severity: SeveritySchema,
  title: z.string(),
  detail: z.string(),
  sourceIds: z.array(z.string()).default([]),
  evidenceSnippet: z.string().optional()
});

export const CandidateArtifactSchema = z.object({
  artifactType: ArtifactTypeSchema,
  rationale: z.string(),
  currentSnippet: z.string().optional(),
  impactScore: z.number().min(1).max(10)
});

export const TinyFishInvestigationResultSchema = z.object({
  repo: z.object({
    owner: z.string(),
    name: z.string(),
    fullName: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
    homepageUrl: z.string().url().optional(),
    defaultBranch: z.string().optional(),
    languages: z.array(z.string()).default([]),
    stars: z.number().int().nonnegative().default(0),
    openIssues: z.number().int().nonnegative().default(0),
    topics: z.array(z.string()).default([]),
    pushedAt: z.string().optional(),
    updatedAt: z.string().optional()
  }),
  surfaces: z.array(TinyFishSurfaceSchema),
  findings: z.array(TinyFishFindingSchema),
  candidateArtifacts: z.array(CandidateArtifactSchema),
  metadata: z.object({
    investigationMode: z.enum(["mock", "sdk"]),
    inspectedAt: z.string(),
    warnings: z.array(z.string()).default([]),
    partialFailures: z.array(z.string()).default([])
  })
});

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;
export type CandidateArtifact = z.infer<typeof CandidateArtifactSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type TinyFishFinding = z.infer<typeof TinyFishFindingSchema>;
export type TinyFishInvestigationResult = z.infer<typeof TinyFishInvestigationResultSchema>;
export type TinyFishSurface = z.infer<typeof TinyFishSurfaceSchema>;
