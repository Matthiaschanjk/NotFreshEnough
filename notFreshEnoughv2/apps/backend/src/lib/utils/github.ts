export interface GitHubRepoReference {
  owner: string;
  repo: string;
}

export function parseGitHubRepoUrl(url: string): GitHubRepoReference | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("github.com")) {
      return null;
    }

    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo: repo.replace(/\.git$/, "")
    };
  } catch {
    return null;
  }
}
