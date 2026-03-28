import { z } from "zod";

export const SimilarProjectsRequestSchema = z.object({
  github_url: z.string().url("Please provide a valid public GitHub repository URL.")
});

export const SimilarProjectInputRepoSchema = z.object({
  full_name: z.string(),
  url: z.string().url(),
  languages: z.array(z.string()),
  topics: z.array(z.string()),
  description: z.string(),
  stars: z.number().int().nonnegative()
});

export const SimilarProjectResultSchema = z.object({
  full_name: z.string(),
  url: z.string().url(),
  description: z.string(),
  similarity_score: z.number().min(0).max(1),
  primary_language: z.string(),
  stars: z.number().int().nonnegative(),
  topic_overlap: z.array(z.string()),
  demo_url_present: z.boolean(),
  docs_quality: z.enum(["low", "med", "high"])
});

export const SimilarProjectsResponseSchema = z.object({
  input_repo: SimilarProjectInputRepoSchema,
  results: z.array(SimilarProjectResultSchema).max(3)
});

export type SimilarProjectsRequest = z.infer<typeof SimilarProjectsRequestSchema>;
export type SimilarProjectsResponse = z.infer<typeof SimilarProjectsResponseSchema>;
export type SimilarProjectResult = z.infer<typeof SimilarProjectResultSchema>;
