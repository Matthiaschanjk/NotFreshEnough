import type { JudgeProjectRequest, JudgeProjectResponse } from "../../types/judgement";

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
