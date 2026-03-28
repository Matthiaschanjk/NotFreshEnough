import type { Env } from "../../config/env";
import { searchGitHubRepositories } from "./githubClient";

export interface RepoSearchCandidate {
  fullName: string;
  owner: string;
  repo: string;
  url: string;
  source: "github" | "devpost" | "linkedin" | "tinyfish";
}

interface BingSearchResponse {
  webPages?: {
    value: Array<{
      name: string;
      url: string;
      snippet?: string;
    }>;
  };
}

interface TinyFishSearchEntry {
  title?: string;
  url?: string;
  description?: string;
  source?: string;
}

interface TinyFishSearchResponse {
  results?: TinyFishSearchEntry[];
  projects?: TinyFishSearchEntry[];
  content?: string;
  text?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, init);
    if (response.status !== 429) {
      return response;
    }

    const retryAfter = Number(response.headers.get("retry-after") ?? "");
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 300 * (attempt + 1));
  }

  throw new Error(`Rate limited while requesting ${url}`);
}

function extractGitHubRepoUrls(text: string) {
  const matches = text.match(/https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g) ?? [];
  return [...new Set(matches.map((value) => value.replace(/[).,]+$/, "")))];
}

function parseGitHubRepoPath(url: string) {
  try {
    const parsed = new URL(url);
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return {
      fullName: `${owner}/${repo}`,
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`
    };
  } catch {
    return null;
  }
}

async function searchViaBing(query: string, site: "devpost.com" | "linkedin.com", env: Env, limit = 5) {
  if (!env.BING_SEARCH_KEY) {
    return [];
  }

  const response = await fetchWithBackoff(
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

function normalizeTinyFishEntries(payload: TinyFishSearchResponse) {
  const entries = payload.results ?? payload.projects ?? [];
  const textMatches = extractGitHubRepoUrls(payload.content ?? payload.text ?? "").map((url) => ({ url, source: "tinyfish" }));
  return [...entries, ...textMatches];
}

async function resolvePageToGitHubUrls(url: string) {
  if (url.includes("github.com/")) {
    return [url];
  }

  const pageResponse = await fetchWithBackoff(url, {
    headers: { "User-Agent": "notfreshenough-cousins" }
  }).catch(() => null);

  if (!pageResponse?.ok) {
    return [];
  }

  return extractGitHubRepoUrls(await pageResponse.text());
}

async function scrapeTinyFishProjects(query: string, env: Env): Promise<RepoSearchCandidate[]> {
  if (env.TINYFISH_MODE !== "sdk" || !env.TINYFISH_API_KEY || !env.TINYFISH_BASE_URL) {
    return [];
  }

  const response = await fetchWithBackoff(`${env.TINYFISH_BASE_URL.replace(/\/$/, "")}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TINYFISH_API_KEY}`
    },
    body: JSON.stringify({
      query: `@TinyFish, please scrape for projects on LinkedIn, Github, Devpost similar to ${query}. Return the top public projects with repository URLs and one-line descriptions.`,
      sources: ["github", "devpost", "linkedin"]
    })
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as TinyFishSearchResponse;
  const entries = normalizeTinyFishEntries(payload);
  const resolvedUrls = await Promise.all(entries.slice(0, 10).map(async (entry) => resolvePageToGitHubUrls(entry.url ?? "")));

  return resolvedUrls.flat().flatMap((url) => {
    const parsed = parseGitHubRepoPath(url);
    return parsed
      ? [
          {
            ...parsed,
            source: "tinyfish" as const
          }
        ]
      : [];
  });
}

async function resolveSiteResults(query: string, source: "devpost" | "linkedin", env: Env): Promise<RepoSearchCandidate[]> {
  const searchResults = await searchViaBing(query, source === "devpost" ? "devpost.com" : "linkedin.com", env);
  const resolved = await Promise.all(searchResults.slice(0, 4).map(async (result) => resolvePageToGitHubUrls(result.url)));

  return resolved.flat().flatMap((url) => {
    const parsed = parseGitHubRepoPath(url);
    return parsed
      ? [
          {
            ...parsed,
            source
          }
        ]
      : [];
  });
}

export async function searchSimilarProjectCandidates(query: string, env: Env) {
  const tinyFishMatches = await scrapeTinyFishProjects(query, env);

  const fallbackMatches =
    tinyFishMatches.length >= 3
      ? []
      : (
          await Promise.all([
            searchGitHubRepositories(query, env, 8),
            resolveSiteResults(query, "devpost", env),
            resolveSiteResults(query, "linkedin", env)
          ])
        ).flat();

  const deduped = new Map<string, RepoSearchCandidate>();
  for (const candidate of [...tinyFishMatches, ...fallbackMatches]) {
    deduped.set(candidate.fullName.toLowerCase(), candidate);
  }

  return [...deduped.values()];
}
