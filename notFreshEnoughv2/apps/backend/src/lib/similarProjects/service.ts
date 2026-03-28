import type OpenAI from "openai";
import type { Env } from "../../config/env";
import { createOpenAiClient } from "../openai/client";
import {
  buildProjectSearchQuery,
  fetchGitHubProject,
  fetchGitHubProjectFromUrl,
  type GitHubRepositoryDocument
} from "./githubClient";
import { SimilarProjectsResponseSchema } from "./schema";
import { searchSimilarProjectCandidates } from "./searchClient";
import { scoreSimilarity } from "./similarity";
import { parseGitHubRepoUrl } from "../utils/github";

function toResponseInput(project: GitHubRepositoryDocument) {
  return {
    full_name: project.fullName,
    url: project.url,
    languages: project.languages,
    topics: project.topics,
    description: project.description,
    stars: project.stars
  };
}

function toResponseResult(project: GitHubRepositoryDocument, similarityScore: number, inputTopics: string[]) {
  return {
    full_name: project.fullName,
    url: project.url,
    description: project.description,
    similarity_score: Number(similarityScore.toFixed(4)),
    primary_language: project.primaryLanguage,
    stars: project.stars,
    topic_overlap: project.topics.filter((topic) => inputTopics.includes(topic)),
    demo_url_present: project.demoUrlPresent,
    docs_quality: project.docsQuality
  } as const;
}

function normalizeRepoStem(repoName: string) {
  return repoName.toLowerCase().replace(/[-_.]?v\d+$/i, "").replace(/[-_.](fork|legacy|old|archive)$/i, "");
}

export function isBlacklistedCandidate(inputRepo: GitHubRepositoryDocument, candidate: GitHubRepositoryDocument) {
  if (candidate.fullName.toLowerCase() === inputRepo.fullName.toLowerCase()) {
    return true;
  }

  if (candidate.isFork && candidate.parentFullName?.toLowerCase() === inputRepo.fullName.toLowerCase()) {
    return true;
  }

  const inputOwner = inputRepo.fullName.split("/")[0]?.toLowerCase();
  const candidateOwner = candidate.fullName.split("/")[0]?.toLowerCase();
  if (inputOwner && candidateOwner && inputOwner === candidateOwner) {
    return normalizeRepoStem(candidate.name) === normalizeRepoStem(inputRepo.name);
  }

  return false;
}

function toOriginalFallbackInput(githubUrl: string): ReturnType<typeof toResponseInput> {
  const parsed = parseGitHubRepoUrl(githubUrl);
  const fullName = parsed ? `${parsed.owner}/${parsed.repo}` : githubUrl;
  return {
    full_name: fullName,
    url: githubUrl,
    languages: [],
    topics: [],
    description: "Original idea project (GitHub metadata unavailable).",
    stars: 0
  };
}

export async function findSimilarProjects(
  githubUrl: string,
  env: Env,
  dependencies?: {
    openAiClient?: OpenAI | null;
  }
) {
  const inputRepo = await fetchGitHubProjectFromUrl(githubUrl, env).catch(() => null);
  if (!inputRepo) {
    return SimilarProjectsResponseSchema.parse({
      input_repo: toOriginalFallbackInput(githubUrl),
      results: [],
      project_status: "original_project",
      message: "Could not fetch GitHub metadata. Treating this as an original idea project."
    });
  }

  const query = buildProjectSearchQuery(inputRepo);
  const openAiClient = dependencies?.openAiClient ?? createOpenAiClient(env);
  const candidates = await searchSimilarProjectCandidates(query, env).catch(() => null);
  if (!candidates) {
    return SimilarProjectsResponseSchema.parse({
      input_repo: toResponseInput(inputRepo),
      results: [],
      project_status: "original_project",
      message: "Repository search failed. Treating this as an original idea project."
    });
  }

  const hydrated = await Promise.all(
    candidates
      .filter((candidate) => candidate.fullName.toLowerCase() !== inputRepo.fullName.toLowerCase())
      .slice(0, 12)
      .map(async (candidate) => {
        const repo = await fetchGitHubProject(candidate.owner, candidate.repo, env).catch(() => null);
        if (!repo) {
          return null;
        }

        const similarity = await scoreSimilarity(inputRepo, repo, openAiClient);
        return {
          repo,
          similarity
        };
      })
  );

  const results = hydrated
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter(({ repo }) => !isBlacklistedCandidate(inputRepo, repo))
    .sort((left, right) => right.similarity.similarityScore - left.similarity.similarityScore)
    .slice(0, 3)
    .map(({ repo, similarity }) => toResponseResult(repo, similarity.similarityScore, inputRepo.topics));

  return SimilarProjectsResponseSchema.parse({
    input_repo: toResponseInput(inputRepo),
    results,
    project_status: results.length > 0 ? "cousins_found" : "original_project",
    message:
      results.length > 0
        ? `Found ${results.length} cousin project${results.length === 1 ? "" : "s"} across different repositories.`
        : "No cousin repositories were confirmed. This appears to be an original idea project."
  });
}
