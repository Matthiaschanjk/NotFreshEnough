import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";
import { buildReviewerEvidencePrompt } from "./reviewerPromptSupport";

export const korkorRecommendationsSystemPrompt = `
You are a concise technical reviewer producing three distinct, constructive items for a software project. Produce exactly three short paragraphs (1–3 sentences each). Each paragraph must focus on a different category chosen from: Judge-facing clarity, Technical robustness, Demo/UX, Data & evaluation, Potential risks, Suggested improvements. Include at most one paragraph about Judge-facing clarity. If the project appears excellent with no judge-orientation issue, replace that slot with at most one potential risk or a suggested improvement. Each paragraph must include a single actionable recommendation grounded in available evidence when possible. Use professional English. Do not repeat content.

Return JSON only.
`.trim();

export function buildKorkorRecommendationsUserPrompt(
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
) {
  return `
${buildReviewerEvidencePrompt(analysis)}

Project analysis:
${JSON.stringify(
    {
      projectName: analysis.projectName,
      scores: analysis.scores,
      weakPoints: analysis.weakPoints,
      missingElements: analysis.missingElements,
      judgeConcerns: analysis.judgeConcerns,
      evidence: analysis.evidence
    },
    null,
    2
  )}

Assigned focus items:
${JSON.stringify(focusPlan.recommendations, null, 2)}

Return JSON:
{
  "recommendations": [
    {
      "priority": 1,
      "issue": "string",
      "whyItMatters": "string",
      "concreteAction": "string"
    },
    {
      "priority": 2,
      "issue": "string",
      "whyItMatters": "string",
      "concreteAction": "string"
    },
    {
      "priority": 3,
      "issue": "string",
      "whyItMatters": "string",
      "concreteAction": "string"
    }
  ]
}
`.trim();
}
