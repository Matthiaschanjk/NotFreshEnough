import type OpenAI from "openai";
import { createEmbedding, type GitHubRepositoryDocument } from "./githubClient";

export interface SimilarityBreakdown {
  textSimilarity: number;
  languageOverlap: number;
  topicOverlap: number;
  recencyScore: number;
  popularityScore: number;
  docsScore: number;
  similarityScore: number;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token.length > 2);
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function buildTfVector(leftText: string, rightText: string) {
  const vocabulary = [...new Set([...tokenize(leftText), ...tokenize(rightText)])];
  const leftCounts = new Map<string, number>();
  const rightCounts = new Map<string, number>();

  for (const token of tokenize(leftText)) {
    leftCounts.set(token, (leftCounts.get(token) ?? 0) + 1);
  }

  for (const token of tokenize(rightText)) {
    rightCounts.set(token, (rightCounts.get(token) ?? 0) + 1);
  }

  return {
    left: vocabulary.map((token) => leftCounts.get(token) ?? 0),
    right: vocabulary.map((token) => rightCounts.get(token) ?? 0)
  };
}

function docsQualityWeight(value: GitHubRepositoryDocument["docsQuality"]) {
  return value === "high" ? 1 : value === "med" ? 0.65 : 0.3;
}

function daysSince(date: string) {
  const delta = Date.now() - new Date(date).getTime();
  return delta / (1000 * 60 * 60 * 24);
}

async function computeTextSimilarity(
  inputRepo: GitHubRepositoryDocument,
  candidate: GitHubRepositoryDocument,
  client?: OpenAI | null
) {
  const leftText = `${inputRepo.description}\n${inputRepo.readme}`;
  const rightText = `${candidate.description}\n${candidate.readme}`;

  if (client) {
    const [leftEmbedding, rightEmbedding] = await Promise.all([
      createEmbedding(client, leftText),
      createEmbedding(client, rightText)
    ]);

    return clamp((cosineSimilarity(leftEmbedding, rightEmbedding) + 1) / 2);
  }

  const tfVectors = buildTfVector(leftText, rightText);
  return clamp(cosineSimilarity(tfVectors.left, tfVectors.right));
}

export async function scoreSimilarity(
  inputRepo: GitHubRepositoryDocument,
  candidate: GitHubRepositoryDocument,
  client?: OpenAI | null
): Promise<SimilarityBreakdown> {
  const sharedLanguages = inputRepo.languages.filter((language) => candidate.languages.includes(language));
  const allLanguages = new Set([...inputRepo.languages, ...candidate.languages]);
  const sharedTopics = inputRepo.topics.filter((topic) => candidate.topics.includes(topic));
  const allTopics = new Set([...inputRepo.topics, ...candidate.topics]);
  const popularityScore =
    inputRepo.stars === 0 && candidate.stars === 0
      ? 1
      : Math.min(inputRepo.stars, candidate.stars) / Math.max(inputRepo.stars || 1, candidate.stars || 1);
  const recencyGap = Math.abs(daysSince(inputRepo.lastCommit) - daysSince(candidate.lastCommit));
  const recencyScore = clamp(1 - recencyGap / 365);
  const textSimilarity = await computeTextSimilarity(inputRepo, candidate, client);
  const languageOverlap = allLanguages.size === 0 ? 0 : sharedLanguages.length / allLanguages.size;
  const topicOverlap = allTopics.size === 0 ? 0 : sharedTopics.length / allTopics.size;
  const docsScore = (docsQualityWeight(inputRepo.docsQuality) + docsQualityWeight(candidate.docsQuality)) / 2;

  const similarityScore = clamp(
    textSimilarity * 0.56 +
      languageOverlap * 0.12 +
      topicOverlap * 0.14 +
      recencyScore * 0.08 +
      popularityScore * 0.05 +
      docsScore * 0.05
  );

  return {
    textSimilarity,
    languageOverlap,
    topicOverlap,
    recencyScore,
    popularityScore,
    docsScore,
    similarityScore
  };
}
