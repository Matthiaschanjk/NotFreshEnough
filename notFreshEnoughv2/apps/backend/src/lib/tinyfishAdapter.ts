import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Env } from "../config/env";

export interface TinyFishSearchHit {
  title: string;
  url: string;
  snippet: string;
  source: "github" | "devpost" | "linkedin";
}

interface TinyFishSearchRequest {
  target_url: string;
  target_repo: string;
  blacklist: string[];
  sources: Array<TinyFishSearchHit["source"]>;
  max_results: number;
}

interface TinyFishSearchResponse {
  results?: Array<Partial<TinyFishSearchHit>>;
  hits?: Array<Partial<TinyFishSearchHit>>;
  candidates?: Array<Partial<TinyFishSearchHit>>;
  result?: unknown;
  data?: unknown;
  output?: unknown;
  final_output?: unknown;
}

export interface TinyFishEvidenceInspection {
  snippet: string;
  workflow: string;
  technologies: string[];
  githubUrls: string[];
  headings: string[];
  text: string;
}

const DEFAULT_FIXTURE_PATH = resolve(process.cwd(), "src/test/fixtures/tinyfish/search-results.json");
const RUN_USER_AGENT = "NotFreshEnough/1.0";

function sanitizeRequestForLog(input: TinyFishSearchRequest) {
  return {
    target_repo: input.target_repo,
    target_url: input.target_url,
    blacklistCount: input.blacklist.length,
    sources: input.sources,
    max_results: input.max_results
  };
}

export function buildTinyFishRunGoal(inputRepoUrl: string) {
  return [
    `Inspect this public repository page (${inputRepoUrl}) to understand the project's purpose.`,
    "Then search for the top 3 public projects that are similar in purpose.",
    "Look on GitHub, LinkedIn, and DevPost for cousin projects.",
    "Do not include projects that are reforks from the same project maker.",
    "Extract each candidate project's title, short description, repository or profile URL, star or like count when visible, primary language or technology stack when visible, and any available tags or categories.",
    'Return only JSON with this shape: {"results":[{"title":"string","url":"string","snippet":"string","source":"github|devpost|linkedin","stars_or_likes":"string","primary_stack":"string","tags":["string"]}]}.'
  ].join(" ");
}

function normalizeHit(hit: Partial<TinyFishSearchHit>): TinyFishSearchHit | null {
  if (!hit.url || !hit.source) {
    return null;
  }

  const source = hit.source.toLowerCase();
  if (source !== "github" && source !== "devpost" && source !== "linkedin") {
    return null;
  }

  return {
    title: (hit.title ?? hit.url).trim(),
    url: hit.url.trim(),
    snippet: (hit.snippet ?? "").trim(),
    source
  };
}

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean).join("\n");
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => toText(entry))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

function extractMarkdownHits(text: string) {
  const matches = [...text.matchAll(/\d+\.\s+\*\*(.+?)\*\*[\s\S]*?(?=\n\d+\.\s+\*\*|$)/g)];
  return matches
    .map((match) => {
      const block = match[0];
      const title = match[1]?.trim();
      if (!title) {
        return null;
      }

      const urlMatch = block.match(/https?:\/\/[^\s)]+/i);
      const sourceMatch = block.match(/Primary Source:\s*([^\n*]+)/i);
      const purposeMatch = block.match(/Purpose:\s*([^\n]+)/i);
      const sourceText = sourceMatch?.[1]?.toLowerCase() ?? block.toLowerCase();
      const source = sourceText.includes("linkedin")
        ? "linkedin"
        : sourceText.includes("devpost")
          ? "devpost"
          : "github";

      return normalizeHit({
        title,
        url: urlMatch?.[0] ?? "",
        snippet: purposeMatch?.[1] ?? block.replace(/\s+/g, " ").trim(),
        source
      });
    })
    .filter((hit): hit is TinyFishSearchHit => Boolean(hit));
}

function extractHitsFromRunPayload(payload: TinyFishSearchResponse) {
  const directHits = [...(payload.results ?? []), ...(payload.hits ?? []), ...(payload.candidates ?? [])]
    .map(normalizeHit)
    .filter((hit): hit is TinyFishSearchHit => Boolean(hit));
  if (directHits.length > 0) {
    return directHits;
  }

  const source = payload.result ?? payload.data ?? payload.output ?? payload.final_output ?? payload;
  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>;
    const nestedHits = [
      ...(Array.isArray(record.results) ? record.results : []),
      ...(Array.isArray(record.hits) ? record.hits : []),
      ...(Array.isArray(record.candidates) ? record.candidates : [])
    ]
      .map((hit) => normalizeHit(hit as Partial<TinyFishSearchHit>))
      .filter((hit): hit is TinyFishSearchHit => Boolean(hit));

    if (nestedHits.length > 0) {
      return nestedHits;
    }
  }

  const text = toText(source);
  const jsonBlock = extractJsonBlock(text);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock) as TinyFishSearchResponse;
      const parsedHits = [...(parsed.results ?? []), ...(parsed.hits ?? []), ...(parsed.candidates ?? [])]
        .map(normalizeHit)
        .filter((hit): hit is TinyFishSearchHit => Boolean(hit));
      if (parsedHits.length > 0) {
        return parsedHits;
      }
    } catch {
      // Fall through to markdown parsing.
    }
  }

  return extractMarkdownHits(text);
}

function hasBlacklistedFragment(url: string, blacklist: string[]) {
  const lowerUrl = url.toLowerCase();
  return blacklist.some((entry) => lowerUrl.includes(entry.toLowerCase()));
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry).trim()).filter(Boolean) : [];
}

function extractEvidenceInspection(payload: TinyFishSearchResponse): TinyFishEvidenceInspection | null {
  const source = payload.result ?? payload.data ?? payload.output ?? payload.final_output ?? payload;
  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>;
    if (
      typeof record.snippet === "string" ||
      typeof record.workflow === "string" ||
      Array.isArray(record.github_urls) ||
      Array.isArray(record.technologies)
    ) {
      return {
        snippet: typeof record.snippet === "string" ? record.snippet.trim() : "",
        workflow: typeof record.workflow === "string" ? record.workflow.trim() : "",
        technologies: asStringArray(record.technologies),
        githubUrls: asStringArray(record.github_urls),
        headings: asStringArray(record.headings),
        text: toText(source)
      };
    }
  }

  const text = toText(source);
  const jsonBlock = extractJsonBlock(text);
  if (!jsonBlock) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonBlock) as Record<string, unknown>;
    return {
      snippet: typeof parsed.snippet === "string" ? parsed.snippet.trim() : "",
      workflow: typeof parsed.workflow === "string" ? parsed.workflow.trim() : "",
      technologies: asStringArray(parsed.technologies),
      githubUrls: asStringArray(parsed.github_urls),
      headings: asStringArray(parsed.headings),
      text
    };
  } catch {
    return null;
  }
}

async function loadMockHits() {
  const payload = JSON.parse(await readFile(DEFAULT_FIXTURE_PATH, "utf8")) as TinyFishSearchResponse;
  return [...(payload.results ?? []), ...(payload.hits ?? []), ...(payload.candidates ?? [])]
    .map(normalizeHit)
    .filter((hit): hit is TinyFishSearchHit => Boolean(hit));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postTinyFishRun(url: string, apiKey: string, body: string, attempts = 3): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`
      },
      body
    });

    if (response.status !== 429 && response.status < 500) {
      return response;
    }

    lastResponse = response;
    const retryAfter = Number(response.headers.get("retry-after") ?? "");
    const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 400 * 2 ** attempt;
    await sleep(delay);
  }

  return lastResponse ?? new Response(null, { status: 500 });
}

export async function searchWithTinyFish(input: TinyFishSearchRequest, env: Env): Promise<TinyFishSearchHit[]> {
  console.info("[TinyFish] run request", JSON.stringify(sanitizeRequestForLog(input)));

  if (env.TINYFISH_MODE === "mock") {
    const hits = (await loadMockHits())
      .filter((hit) => !hasBlacklistedFragment(hit.url, input.blacklist))
      .slice(0, input.max_results);

    console.info("[TinyFish] mock run response", JSON.stringify({ hits: hits.length }));
    return hits;
  }

  if (!env.TINYFISH_API_KEY) {
    throw new Error("TinyFish run requested without TINYFISH_API_KEY.");
  }

  const baseUrl = env.TINYFISH_BASE_URL.replace(/\/$/, "");
  const requestPayload = {
    url: input.target_url,
    goal: buildTinyFishRunGoal(input.target_url),
    browser_profile: "stealth",
    options: {
      sources: input.sources,
      max_results: input.max_results,
      respect_robots: true,
      rate_limit_per_host: 2,
      user_agent: RUN_USER_AGENT,
      blacklist: input.blacklist
    }
  };
  console.info("[TinyFish] run body", JSON.stringify({
    url: requestPayload.url,
    goal: requestPayload.goal,
    browser_profile: requestPayload.browser_profile,
    options: {
      ...requestPayload.options,
      blacklist_count: requestPayload.options.blacklist.length
    }
  }));

  const response = await postTinyFishRun(`${baseUrl}/automation/run`, env.TINYFISH_API_KEY, JSON.stringify(requestPayload));

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `TinyFish run failed with ${response.status}.`);
  }

  const payload = (await response.json()) as TinyFishSearchResponse;
  const hits = extractHitsFromRunPayload(payload)
    .filter((hit) => !hasBlacklistedFragment(hit.url, input.blacklist))
    .slice(0, input.max_results);

  console.info("[TinyFish] run response", JSON.stringify({ hits: hits.length }));
  return hits;
}

export async function inspectEvidenceWithTinyFish(url: string, env: Env): Promise<TinyFishEvidenceInspection | null> {
  if (env.TINYFISH_MODE === "mock" || !env.TINYFISH_API_KEY) {
    return null;
  }

  const baseUrl = env.TINYFISH_BASE_URL.replace(/\/$/, "");
  const requestPayload = {
    url,
    browser_profile: "stealth",
    goal:
      'Inspect this public project page and return only JSON with this shape: {"snippet":"string","workflow":"string","technologies":["string"],"github_urls":["string"],"headings":["string"]}. Include the clearest workflow clues, explicit tech stack mentions, and any linked GitHub repository URLs.'
  };

  console.info("[TinyFish] evidence body", JSON.stringify({ url: requestPayload.url, goal: requestPayload.goal }));
  const response = await postTinyFishRun(`${baseUrl}/automation/run`, env.TINYFISH_API_KEY, JSON.stringify(requestPayload));

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as TinyFishSearchResponse;
  return extractEvidenceInspection(payload);
}
