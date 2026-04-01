import type OpenAI from "openai";
import type { Env } from "../../config/env";
import { HttpError } from "../utils/httpError";
import { parseGitHubRepoUrl } from "../utils/github";

const GITHUB_API_BASE = "https://api.github.com";
const README_ACCEPT = "application/vnd.github.raw+json";
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

export interface GitHubRepositoryDocument {
  fullName: string;
  name: string;
  url: string;
  description: string;
  stars: number;
  lastCommit: string;
  license: string;
  topics: string[];
  languages: string[];
  primaryLanguage: string;
  readme: string;
  readmeKeywords: string[];
  docsQuality: "low" | "med" | "high";
  demoUrlPresent: boolean;
  demoUrl?: string;
  homepage?: string;
  isFork: boolean;
  parentFullName?: string;
}

interface GitHubRepoApiResponse {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  license: { spdx_id?: string | null; name?: string | null } | null;
  topics?: string[];
  homepage: string | null;
  default_branch: string;
  fork?: boolean;
  parent?: { full_name?: string | null } | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(env: Env, accept = "application/vnd.github+json") {
  return {
    Accept: accept,
    "User-Agent": "notfreshenough-cousins",
    ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {})
  };
}

async function fetchWithBackoff(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.status !== 429) {
        return response;
      }

      const retryAfter = Number(response.headers.get("retry-after") ?? "");
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 400 * (attempt + 1));
    } catch (error) {
      lastError = error;
      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request failed for ${url}`);
}

function normalizeMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/[>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickDescription(repo: GitHubRepoApiResponse, readme: string) {
  if (repo.description?.trim()) {
    return repo.description.trim();
  }

  const paragraph = normalizeMarkdown(readme)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .trim();

  return paragraph || "No repository description available.";
}

function scoreDocsQuality(readme: string): "low" | "med" | "high" {
  const headingCount = (readme.match(/^#+\s+/gm) ?? []).length;
  const hasSetup = /installation|getting started|setup|run/i.test(readme);
  const hasUsage = /usage|example|demo|how it works|features/i.test(readme);
  const length = normalizeMarkdown(readme).length;

  if (length > 1400 && headingCount >= 3 && hasSetup && hasUsage) {
    return "high";
  }

  if (length > 450 && (hasSetup || hasUsage)) {
    return "med";
  }

  return "low";
}

function extractKeywords(input: string, limit = 15) {
  const tokens = input
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));

  return [...new Set(tokens)].slice(0, limit);
}

export function buildProjectSearchQuery(project: GitHubRepositoryDocument) {
  return [
    project.name.replace(/[-_]/g, " "),
    project.description,
    ...project.topics.slice(0, 5),
    ...project.readmeKeywords.slice(0, 5)
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

async function fetchRepoJson(owner: string, repo: string, env: Env) {
  const response = await fetchWithBackoff(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: buildHeaders(env)
  });

  if (response.status === 404) {
    throw new HttpError(404, "That GitHub repository could not be found or is not public.");
  }

  if (!response.ok) {
    throw new Error(`GitHub metadata request failed with ${response.status}.`);
  }

  return (await response.json()) as GitHubRepoApiResponse;
}

async function fetchLanguages(owner: string, repo: string, env: Env) {
  const response = await fetchWithBackoff(`${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`, {
    headers: buildHeaders(env)
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as Record<string, number>;
  return Object.keys(payload);
}

async function fetchReadme(owner: string, repo: string, env: Env) {
  const response = await fetchWithBackoff(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
    headers: buildHeaders(env, README_ACCEPT)
  });

  if (response.status === 404) {
    return "";
  }

  if (!response.ok) {
    throw new Error(`GitHub README request failed with ${response.status}.`);
  }

  return await response.text();
}

export async function fetchGitHubProjectFromUrl(url: string, env: Env) {
  const repoRef = parseGitHubRepoUrl(url);
  if (!repoRef) {
    throw new HttpError(400, "Please provide a valid public GitHub repository URL.");
  }

  return fetchGitHubProject(repoRef.owner, repoRef.repo, env);
}

export async function fetchGitHubProject(owner: string, repo: string, env: Env): Promise<GitHubRepositoryDocument> {
  const [repoData, languages, readme] = await Promise.all([
    fetchRepoJson(owner, repo, env),
    fetchLanguages(owner, repo, env),
    fetchReadme(owner, repo, env)
  ]);

  const description = pickDescription(repoData, readme);
  const normalizedReadme = normalizeMarkdown(readme);
  const primaryLanguage = languages[0] ?? "Unknown";
  const readmeKeywords = extractKeywords(`${repoData.name} ${description} ${normalizedReadme}`);
  const homepage = repoData.homepage?.trim() || undefined;
  const demoUrlFromReadme = readme.match(/https?:\/\/[^\s)]+/i)?.[0];

  return {
    fullName: repoData.full_name,
    name: repoData.name,
    url: repoData.html_url,
    description,
    stars: repoData.stargazers_count,
    lastCommit: repoData.pushed_at,
    license: repoData.license?.spdx_id || repoData.license?.name || "Unknown",
    topics: repoData.topics ?? [],
    languages,
    primaryLanguage,
    readme,
    readmeKeywords,
    docsQuality: scoreDocsQuality(readme),
    demoUrlPresent: Boolean(homepage || /demo|try it live|vercel|netlify/i.test(readme)),
    demoUrl: homepage ?? demoUrlFromReadme,
    homepage,
    isFork: Boolean(repoData.fork),
    parentFullName: repoData.parent?.full_name ?? undefined
  };
}

interface GitHubSearchResponse {
  items: Array<{
    full_name: string;
    html_url: string;
    owner: { login: string };
    name: string;
  }>;
}

export async function searchGitHubRepositories(query: string, env: Env, limit = 8) {
  const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
  const response = await fetchWithBackoff(url, {
    headers: buildHeaders(env)
  });

  if (!response.ok) {
    throw new Error(`GitHub repository search failed with ${response.status}.`);
  }

  const payload = (await response.json()) as GitHubSearchResponse;
  return payload.items.map((item) => ({
    fullName: item.full_name,
    owner: item.owner.login,
    repo: item.name,
    url: item.html_url,
    source: "github" as const
  }));
}

export async function createEmbedding(client: OpenAI, text: string) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 7000)
  });

  return response.data[0]?.embedding ?? [];
}
