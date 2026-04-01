import type OpenAI from "openai";
import { load } from "cheerio";
import type { Env } from "../../config/env";
import { createOpenAiClient } from "../openai/client";
import { fetchWebSurface } from "../tinyfish/fetchers/web";
import { inspectEvidenceWithTinyFish, searchWithTinyFish, type TinyFishSearchHit } from "../tinyfishAdapter";
import {
  createEmbedding,
  fetchGitHubProject,
  fetchGitHubProjectFromUrl,
  searchGitHubRepositories,
  type GitHubRepositoryDocument
} from "../similarProjects/githubClient";
import { SimilarProjectsResponseSchema } from "../similarProjects/schema";
import { scoreSimilarity } from "../similarProjects/similarity";
import { parseGitHubRepoUrl } from "../utils/github";

interface BingSearchResponse {
  webPages?: {
    value: Array<{
      name: string;
      url: string;
      snippet?: string;
    }>;
  };
}

type DiscoveryResult = {
  full_name?: string;
  url: string;
  source: "github" | "devpost" | "linkedin";
  one_line_description: string;
  similarity_score: number;
  primary_language: string;
  stars?: number;
  topic_overlap: string[];
  demo_url_present: boolean;
  docs_quality: "low" | "med" | "high";
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "into",
  "have",
  "using",
  "build",
  "project",
  "repo",
  "application",
  "tool",
  "tools",
  "platform",
  "system"
]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
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

function clip(value: string, length = 220) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > length ? `${trimmed.slice(0, length - 1)}...` : trimmed;
}

function normalizeRepoStem(repoName: string) {
  return repoName.toLowerCase().replace(/[-_.]?v\d+$/i, "").replace(/[-_.](fork|legacy|old|archive)$/i, "");
}

function extractGitHubRepoUrls(text: string) {
  const matches = text.match(/https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g) ?? [];
  return [...new Set(matches.map((value) => value.replace(/[).,]+$/, "")))];
}

function inferPrimaryLanguageFromText(...values: string[]) {
  const combined = values.join(" ").toLowerCase();
  const candidates = [
    "typescript",
    "javascript",
    "python",
    "java",
    "go",
    "rust",
    "c++",
    "c#",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "julia",
    "scala"
  ];

  const match = candidates.find((candidate) => combined.includes(candidate));
  if (!match) {
    return null;
  }

  if (match === "c++" || match === "c#") {
    return match;
  }

  return match.charAt(0).toUpperCase() + match.slice(1);
}

function buildBlacklist(inputRepo: GitHubRepositoryDocument) {
  const variants = new Set<string>([
    inputRepo.fullName.toLowerCase(),
    inputRepo.name.toLowerCase(),
    normalizeRepoStem(inputRepo.name)
  ]);

  const separators = ["-", "_", "."];
  for (const separator of separators) {
    variants.add(`${normalizeRepoStem(inputRepo.name)}${separator}v2`);
    variants.add(`${normalizeRepoStem(inputRepo.name)}${separator}v1`);
    variants.add(`${normalizeRepoStem(inputRepo.name)}${separator}fork`);
  }

  return [...variants];
}

function isBlacklistedGitHubCandidate(inputRepo: GitHubRepositoryDocument, candidate: GitHubRepositoryDocument) {
  if (candidate.fullName.toLowerCase() === inputRepo.fullName.toLowerCase()) {
    return true;
  }

  if (candidate.isFork && candidate.parentFullName?.toLowerCase() === inputRepo.fullName.toLowerCase()) {
    return true;
  }

  return normalizeRepoStem(candidate.name) === normalizeRepoStem(inputRepo.name);
}

function buildQueries(inputRepo: GitHubRepositoryDocument) {
  const repoNameTokens = inputRepo.name.replace(/[-_]/g, " ").trim();
  const topReadmeKeywords = inputRepo.readmeKeywords.slice(0, 15).join(" ");
  const topicDomainTokens = [...inputRepo.topics.slice(0, 8), ...tokenize(inputRepo.description).slice(0, 8)].join(" ");
  return [repoNameTokens, topReadmeKeywords, topicDomainTokens].filter(Boolean);
}

async function searchViaBing(query: string, site: "devpost.com" | "linkedin.com", env: Env, limit = 6) {
  if (!env.BING_SEARCH_KEY) {
    return [];
  }

  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(`site:${site} ${query}`)}&count=${limit}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": env.BING_SEARCH_KEY
      }
    }
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as BingSearchResponse;
  return payload.webPages?.value ?? [];
}

async function searchFallbackHits(inputRepo: GitHubRepositoryDocument, env: Env) {
  const query = buildQueries(inputRepo).join(" ");
  const [githubHits, devpostHits, linkedinHits] = await Promise.all([
    searchGitHubRepositories(query, env, 8).catch(() => []),
    searchViaBing(query, "devpost.com", env),
    searchViaBing(query, "linkedin.com", env)
  ]);

  const normalizedGitHubHits: TinyFishSearchHit[] = githubHits.map((hit) => ({
    title: hit.fullName,
    url: hit.url,
    snippet: hit.fullName,
    source: "github"
  }));

  const normalizedSearchHits: TinyFishSearchHit[] = [
    ...devpostHits.map((hit) => ({
      title: hit.name,
      url: hit.url,
      snippet: hit.snippet ?? "",
      source: "devpost" as const
    })),
    ...linkedinHits.map((hit) => ({
      title: hit.name,
      url: hit.url,
      snippet: hit.snippet ?? "",
      source: "linkedin" as const
    }))
  ];

  return [...normalizedGitHubHits, ...normalizedSearchHits];
}

async function computeTextSimilarity(leftText: string, rightText: string, client?: OpenAI | null) {
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

function scoreDocsQuality(text: string): "low" | "med" | "high" {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length > 1200) {
    return "high";
  }

  if (normalized.length > 320) {
    return "med";
  }

  return "low";
}

async function hydrateListingText(hit: TinyFishSearchHit) {
  if (hit.snippet.trim().length >= 90) {
    return hit.snippet;
  }

  const page = await fetchWebSurface(hit.url).catch(() => null);
  return page?.snippet ?? hit.snippet;
}

async function fetchLinkedGitHubUrlsFromHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "NotFreshEnough/1.0"
    }
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text().catch(() => "");
  if (!contentType.includes("html")) {
    return extractGitHubRepoUrls(body);
  }

  const $ = load(body);
  const hrefMatches = $("a[href]")
    .map((_, element) => $(element).attr("href") ?? "")
    .get()
    .filter(Boolean);

  return extractGitHubRepoUrls(`${body}\n${hrefMatches.join("\n")}`);
}

async function enrichHitEvidence(hit: TinyFishSearchHit, env: Env) {
  const shouldInspect = hit.source !== "github" || hit.snippet.trim().length < 90;
  const tinyFishEvidence = shouldInspect ? await inspectEvidenceWithTinyFish(hit.url, env).catch(() => null) : null;
  const htmlGitHubUrls =
    tinyFishEvidence?.githubUrls.length ? tinyFishEvidence.githubUrls : await fetchLinkedGitHubUrlsFromHtml(hit.url);
  const pageSurface = await fetchWebSurface(hit.url).catch(() => null);

  return {
    text: [hit.title, hit.snippet, tinyFishEvidence?.snippet, tinyFishEvidence?.workflow, pageSurface?.text, pageSurface?.snippet]
      .filter(Boolean)
      .join("\n"),
    snippet: tinyFishEvidence?.snippet || pageSurface?.snippet || hit.snippet,
    githubUrls: [...new Set([...(tinyFishEvidence?.githubUrls ?? []), ...htmlGitHubUrls])],
    technologies: tinyFishEvidence?.technologies ?? [],
    headings: tinyFishEvidence?.headings ?? pageSurface?.headings ?? []
  };
}

async function toStructuredResult(
  inputRepo: GitHubRepositoryDocument,
  hit: TinyFishSearchHit,
  env: Env,
  openAiClient?: OpenAI | null
): Promise<DiscoveryResult | null> {
  const repoRef = parseGitHubRepoUrl(hit.url);
  if (repoRef) {
    const repo = await fetchGitHubProject(repoRef.owner, repoRef.repo, env).catch(() => null);
    if (!repo || isBlacklistedGitHubCandidate(inputRepo, repo)) {
      return null;
    }

    const similarity = await scoreSimilarity(inputRepo, repo, openAiClient);
    return {
      full_name: repo.fullName,
      url: repo.url,
      source: "github",
      one_line_description: clip(repo.description || repo.fullName),
      similarity_score: Number(similarity.similarityScore.toFixed(4)),
      primary_language: repo.primaryLanguage,
      stars: repo.stars,
      topic_overlap: repo.topics.filter((topic) => inputRepo.topics.includes(topic)),
      demo_url_present: repo.demoUrlPresent,
      docs_quality: repo.docsQuality
    };
  }

  const evidence = await enrichHitEvidence(hit, env);
  const linkedRepoUrl = evidence.githubUrls.find((candidateUrl) => Boolean(parseGitHubRepoUrl(candidateUrl)));
  if (linkedRepoUrl) {
    const linkedRepoRef = parseGitHubRepoUrl(linkedRepoUrl);
    if (linkedRepoRef) {
      const linkedRepo = await fetchGitHubProject(linkedRepoRef.owner, linkedRepoRef.repo, env).catch(() => null);
      if (linkedRepo && !isBlacklistedGitHubCandidate(inputRepo, linkedRepo)) {
        const similarity = await scoreSimilarity(inputRepo, linkedRepo, openAiClient);
        return {
          full_name: linkedRepo.fullName,
          url: hit.url,
          source: hit.source,
          one_line_description: clip(linkedRepo.description || evidence.snippet || hit.title),
          similarity_score: Number(similarity.similarityScore.toFixed(4)),
          primary_language: linkedRepo.primaryLanguage,
          stars: linkedRepo.stars,
          topic_overlap: linkedRepo.topics.filter((topic) => inputRepo.topics.includes(topic)),
          demo_url_present: linkedRepo.demoUrlPresent,
          docs_quality: linkedRepo.docsQuality
        };
      }
    }
  }

  const listingText = evidence.snippet || (await hydrateListingText(hit));
  const combinedText = `${hit.title}\n${listingText}\n${evidence.text}`;
  const similarity = await computeTextSimilarity(`${inputRepo.description}\n${inputRepo.readme}`, combinedText, openAiClient);
  const topicOverlap = inputRepo.topics.filter((topic) => combinedText.toLowerCase().includes(topic.toLowerCase()));
  const docsWeight = hit.snippet ? (scoreDocsQuality(hit.snippet) === "high" ? 1 : scoreDocsQuality(hit.snippet) === "med" ? 0.65 : 0.3) : 0.3;
  const heuristicScore = clamp(similarity * 0.78 + (topicOverlap.length > 0 ? 0.12 : 0) + docsWeight * 0.1);
  const inferredLanguage =
    inferPrimaryLanguageFromText(...evidence.technologies, evidence.text, listingText, hit.title) ??
    "Implementation details not exposed in public materials";

  return {
    url: hit.url,
    source: hit.source,
    one_line_description: clip(listingText || hit.title),
    similarity_score: Number(heuristicScore.toFixed(4)),
    primary_language: inferredLanguage,
    topic_overlap: topicOverlap,
    demo_url_present: /demo|try|prototype|launch/i.test(`${hit.url} ${listingText}`),
    docs_quality: scoreDocsQuality(`${listingText}\n${evidence.text}`)
  };
}

function dedupeHits(hits: TinyFishSearchHit[]) {
  const deduped = new Map<string, TinyFishSearchHit>();
  for (const hit of hits) {
    deduped.set(hit.url.toLowerCase(), hit);
  }

  return [...deduped.values()];
}

export async function discoverSimilarProjects(
  githubUrl: string,
  env: Env,
  dependencies?: {
    openAiClient?: OpenAI | null;
  }
) {
  const inputRepo = await fetchGitHubProjectFromUrl(githubUrl, env).catch(() => null);
  if (!inputRepo) {
    return SimilarProjectsResponseSchema.parse({
      input_repo: {
        full_name: githubUrl,
        url: githubUrl,
        languages: [],
        topics: [],
        description: "Original idea project (GitHub metadata unavailable).",
        stars: 0
      },
      results: [],
      project_status: "original_project",
      message: "Could not fetch GitHub metadata. Treating this as an original idea project."
    });
  }

  const openAiClient = dependencies?.openAiClient ?? createOpenAiClient(env);
  const blacklist = buildBlacklist(inputRepo);
  const tinyFishHits = await searchWithTinyFish(
    {
      target_url: inputRepo.url,
      target_repo: inputRepo.fullName,
      blacklist,
      sources: ["github", "devpost", "linkedin"],
      max_results: 50
    },
    env
  ).catch(() => []);

  const discoveryHits = dedupeHits(tinyFishHits).filter((hit) => !blacklist.some((entry) => hit.url.toLowerCase().includes(entry)));
  const strengthenedHits =
    discoveryHits.length > 0 && discoveryHits.some((hit) => hit.source !== "github" && hit.snippet.trim().length < 90)
      ? dedupeHits(
          discoveryHits.concat(
            (
              await searchWithTinyFish(
                {
                  target_url: inputRepo.url,
                  target_repo: inputRepo.fullName,
                  blacklist,
                  sources: ["github", "devpost", "linkedin"],
                  max_results: 50
                },
                env
              ).catch(() => [])
            )
          )
        )
      : discoveryHits;
  const fallbackHits = strengthenedHits.length > 0 ? [] : await searchFallbackHits(inputRepo, env);

  const structured = await Promise.all(
    dedupeHits([...strengthenedHits, ...fallbackHits])
      .slice(0, 16)
      .map((hit) => toStructuredResult(inputRepo, hit, env, openAiClient))
  );

  const results = structured
    .filter((item): item is DiscoveryResult => Boolean(item))
    .sort((left, right) => right.similarity_score - left.similarity_score)
    .slice(0, 3);

  return SimilarProjectsResponseSchema.parse({
    input_repo: {
      full_name: inputRepo.fullName,
      url: inputRepo.url,
      languages: inputRepo.languages,
      topics: inputRepo.topics,
      description: inputRepo.description,
      stars: inputRepo.stars
    },
    results,
    project_status: results.length > 0 ? "cousins_found" : "original_project",
    message:
      results.length > 0
        ? `Found ${results.length} similar public project${results.length === 1 ? "" : "s"} across TinyFish discovery sources.`
        : "No cousin projects were confirmed. This appears to be an original idea project."
  });
}
