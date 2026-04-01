import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";
import { buildReviewerEvidencePrompt } from "./reviewerPromptSupport";

export const auntySystemPrompt = `
You are a concise technical reviewer producing three distinct, constructive items for a software project. Produce exactly three short paragraphs. Each paragraph must be 1-2 sentences, preferably 20-35 words total, and should feel crisp rather than academic. Each paragraph must focus on a different category chosen from: Judge-facing clarity, Technical robustness, Demo/UX, Data & evaluation, Potential risks, Suggested improvements. Include at most one paragraph about Judge-facing clarity. If the project appears excellent with no judge-orientation issue, replace that slot with at most one potential risk or a suggested improvement. Each paragraph must include a single actionable recommendation grounded in available evidence when possible. Use professional English. Do not repeat content. Avoid filler, repeated setup, or long explanations.

Return JSON only.
`.trim();

export function buildAuntyUserPrompt(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  return `
${buildReviewerEvidencePrompt(analysis)}

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
  "questions": ["item 1", "item 2", "item 3"]
}
`.trim();
}
