import type { JudgeProjectInput } from "../schemas/input";
import type { TinyFishInvestigationResult } from "../schemas/tinyfish";

export const evaluatorSystemPrompt = `
You are a serious hackathon evaluator.
TinyFish already investigated the project.
Your job is to convert grounded evidence into a reusable structured analysis object.

Rules:
- Do not roleplay.
- Do not be funny.
- Do not invent evidence, URLs, technical details, or strengths.
- If evidence is weak or missing, say so clearly.
- Keep the analysis useful for downstream persona generation.
- Return JSON only.
`.trim();

export function buildEvaluatorUserPrompt(input: JudgeProjectInput, investigation: TinyFishInvestigationResult) {
  return `
Create a shared project analysis JSON object from the TinyFish investigation below.

Output shape:
{
  "projectName": string,
  "summary": string,
  "sourcesInspected": [{ "id": string, "label": string, "surfaceType": string, "status": string, "url"?: string }],
  "strongPoints": [{ "title": string, "detail": string, "severity": "low" | "medium" | "high", "evidenceIds": string[] }],
  "weakPoints": [{ "title": string, "detail": string, "severity": "low" | "medium" | "high", "evidenceIds": string[] }],
  "missingElements": [{ "title": string, "detail": string, "severity": "low" | "medium" | "high", "evidenceIds": string[] }],
  "judgeConcerns": [{ "title": string, "detail": string, "severity": "low" | "medium" | "high", "evidenceIds": string[] }],
  "evidence": [{ "id": string, "title": string, "detail": string, "signal": "positive" | "negative" | "neutral", "sourceIds": string[], "excerpt"?: string }],
  "scores": {
    "clarity": number,
    "completeness": number,
    "differentiation": number,
    "usability": number,
    "technicalDepth": number,
    "freshness": number,
    "overall": number,
    "overallGrade": "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "D-" | "F"
  },
  "bestArtifactToRefurbish": {
    "artifactType": "README intro" | "landing page hero section" | "30-second demo pitch" | "what judges should know section" | "project summary",
    "reason": string,
    "sourceSnippet"?: string
  },
  "freshnessNarrative": string
}

Constraints:
- Keep summary to 2 sentences max.
- Keep strongPoints to 2-4 items.
- Keep weakPoints to 3-5 items.
- Keep missingElements to 0-4 items.
- Keep judgeConcerns to 2-4 items.
- Keep evidence to 4-8 items.
- Scores must be between 1 and 10.
- Overall grade must reflect the overall score.
- weakPoints must describe concrete, observable shortcomings in the repo, README, demo, docs, or exposed implementation.
- judgeConcerns must describe the likely concerns or doubts a hackathon judge would infer from those weak points.
- weakPoints and judgeConcerns must never reuse the same title or the same sentence.
- judgeConcerns must be written from a judging perspective using consequence-oriented phrasing such as "Judges may...", "Judges may question...", or "Judges may hesitate...".
- weakPoints should stay evidence-based and directly observable; judgeConcerns should stay evaluative and higher-level.

User input:
${JSON.stringify(input, null, 2)}

TinyFish investigation:
${JSON.stringify(investigation, null, 2)}
`.trim();
}
