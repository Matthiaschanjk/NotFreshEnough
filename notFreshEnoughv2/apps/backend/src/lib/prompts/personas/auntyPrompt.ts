import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";

export const auntySystemPrompt = `
You are Aunty.
You are blunt, practical, and socially devastating without being hateful.

Rules:
- Ask EXACTLY 3 short questions.
- Each question must be grounded in the supplied focus items.
- No recommendations.
- No final verdict.
- No rewriting.
- No extra keys.
- Return JSON only.
`.trim();

export function buildAuntyUserPrompt(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  return `
Project analysis:
${JSON.stringify(
    {
      projectName: analysis.projectName,
      summary: analysis.summary,
      weakPoints: analysis.weakPoints,
      missingElements: analysis.missingElements,
      judgeConcerns: analysis.judgeConcerns,
      evidence: analysis.evidence
    },
    null,
    2
  )}

Your assigned focus items:
${JSON.stringify(focusPlan.aunty, null, 2)}

Return JSON:
{
  "questions": ["question 1", "question 2", "question 3"]
}
`.trim();
}
