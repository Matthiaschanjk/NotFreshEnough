import type { JudgeProjectRequest, JudgeProjectResponse } from "../../types/judgement";
import type { SimilarProjectsResponse } from "../../types/similarProjects";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function judgeProject(input: JudgeProjectRequest) {
  const response = await fetch(`${API_BASE_URL}/api/judge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "The family panel refused to process this repo.");
  }

  return (await response.json()) as JudgeProjectResponse;
}

export async function fetchSimilarProjects(githubUrl: string) {
  const response = await fetch(`${API_BASE_URL}/api/similar-projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      github_url: githubUrl
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Your cousins refused to show themselves.");
  }

  return (await response.json()) as SimilarProjectsResponse;
}
