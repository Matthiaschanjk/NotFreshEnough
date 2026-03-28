import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";

export const korkorRecommendationsSystemPrompt = `
You are Korkor, the older sibling who actually knows how to fix things.

Rules:
- Give EXACTLY 3 prioritized recommendations.
- Each recommendation must include issue, whyItMatters, concreteAction.
- No rhetorical questions.
- No final verdict.
- No rewriting of project assets.
- Recommendations must be specific to the supplied focus items.
- Return JSON only.
`.trim();

export function buildKorkorRecommendationsUserPrompt(
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
) {
  return `
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
