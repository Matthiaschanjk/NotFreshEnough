import { env } from "../../../config/env";
import { HttpError } from "../../utils/httpError";

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  default_branch: string;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  topics: string[];
  html_url: string;
}

function getGitHubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "NotFreshEnough/1.0",
    ...(env.GITHUB_TOKEN
      ? {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`
        }
      : {})
  };
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: getGitHubHeaders()
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    const suffix =
      response.status === 404
        ? "Repo may be private, missing, or the URL may be wrong."
        : response.status === 403
          ? env.GITHUB_TOKEN
            ? "GitHub rejected the authenticated request or the token has insufficient scope."
            : "GitHub may be rate-limiting this request. Add GITHUB_TOKEN to raise the API limit."
          : payload?.message ?? "Unexpected GitHub API failure.";

    throw new HttpError(response.status, `GitHub API request failed for ${url} (${response.status}). ${suffix}`);
  }

  return (await response.json()) as T;
}

export async function fetchGitHubRepo(owner: string, repo: string) {
  return fetchGitHubJson<GitHubRepoResponse>(`https://api.github.com/repos/${owner}/${repo}`);
}

export async function fetchGitHubLanguages(owner: string, repo: string) {
  const payload = await fetchGitHubJson<Record<string, number>>(
    `https://api.github.com/repos/${owner}/${repo}/languages`
  );

  return Object.keys(payload);
}

export async function fetchGitHubReadme(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: getGitHubHeaders()
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    const suffix =
      response.status === 403
        ? env.GITHUB_TOKEN
          ? "GitHub rejected the authenticated README request or the token has insufficient scope."
          : "GitHub may be rate-limiting this README request. Add GITHUB_TOKEN to raise the API limit."
        : payload?.message ?? "Unexpected GitHub README failure.";

    throw new HttpError(response.status, `GitHub README request failed for ${owner}/${repo} (${response.status}). ${suffix}`);
  }

  const payload = (await response.json()) as {
    content?: string;
    html_url?: string;
    download_url?: string;
  };

  const content = payload.content
    ? Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8")
    : "";

  return {
    content,
    htmlUrl: payload.html_url,
    downloadUrl: payload.download_url
  };
}
