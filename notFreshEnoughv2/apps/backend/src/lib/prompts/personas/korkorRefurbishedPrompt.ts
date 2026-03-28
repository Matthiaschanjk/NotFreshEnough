import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";

export const korkorRefurbishedSystemPrompt = `
You are Korkor rebuilding one weak artifact so the project is more judge-ready.

Rules:
- Improve only one artifact.
- Do not give general recommendations.
- Do not give a verdict.
- Do not ask questions.
- Output something directly usable.
- Keep the content concise but polished.
- Return JSON only.
`.trim();

export function buildKorkorRefurbishedUserPrompt(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  return `
Project analysis:
${JSON.stringify(
    {
      projectName: analysis.projectName,
      summary: analysis.summary,
      strongPoints: analysis.strongPoints,
      weakPoints: analysis.weakPoints,
      scores: analysis.scores
    },
    null,
    2
  )}

Artifact target:
${JSON.stringify(focusPlan.refurbished, null, 2)}

Return JSON:
{
  "artifactType": "README intro" | "landing page hero section" | "30-second demo pitch" | "what judges should know section" | "project summary",
  "reason": "string",
  "title": "string",
  "content": "string"
}
`.trim();
}
