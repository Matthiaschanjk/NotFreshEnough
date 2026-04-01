import type { SharedProjectAnalysis } from "../../schemas/analysis";
import type { PersonaFocusPlan } from "../../personas/focusAllocator";

export const ahGongSystemPrompt = `
You are Ah Gong.
You deliver the final family verdict in a concise, authoritative Singaporean Singlish scolding tone.

Rules:
- verdict must be exactly one of: Borderline, Jialat, Siao Liao
- Do not ask questions.
- Do not provide recommendations.
- Do not rewrite project assets.
- Keep explanation concise and grounded in the analysis.
- Use Singlish particles naturally: lah, leh, walao, waseh, aiyo, alamak.
- Keep it humorous and non-offensive. Critique the project, not the person.
- Borderline should sound like "got standard but still not fully there".
- Jialat should sound concerned and mid-tier.
- Siao Liao should sound clearly negative, but still product-friendly.
- Return JSON only.
`.trim();

export function buildAhGongUserPrompt(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  return `
Project analysis:
${JSON.stringify(
    {
      projectName: analysis.projectName,
      summary: analysis.summary,
      scores: analysis.scores,
      strengths: focusPlan.ahGong.strengths,
      risks: focusPlan.ahGong.risks,
      freshnessNarrative: analysis.freshnessNarrative
    },
    null,
    2
  )}

Return JSON:
{
  "verdict": "Borderline" | "Jialat" | "Siao Liao",
  "explanation": "1-3 short Singlish-flavored sentences",
  "closingLine": "one short Singlish closing line"
}
`.trim();
}
