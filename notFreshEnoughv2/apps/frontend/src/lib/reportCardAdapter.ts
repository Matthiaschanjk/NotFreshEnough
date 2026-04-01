import type { JudgeProjectResponse } from "../types/judgement";

export interface ReportCardViewModel {
  grade: string;
  summary: string;
  familyHeadline: string;
  auntyQuestions: string[];
}

function sentenceCase(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ensureSentence(value: string) {
  const normalized = sentenceCase(value);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function buildSummary(result: JudgeProjectResponse) {
  const projectName = result.analysis.projectName;
  const strongest = result.analysis.strongPoints[0]?.detail;
  const weakest = result.analysis.weakPoints[0]?.detail;
  const freshness = result.analysis.freshnessNarrative;
  const sentences = [
    `${projectName} is understandable from its public surfaces, and the overall concept is visible without deep digging.`,
    strongest ? `The clearest strength is ${strongest.replace(/^\w/, (letter) => letter.toLowerCase())}` : "",
    weakest ? `The main weakness is ${weakest.replace(/^\w/, (letter) => letter.toLowerCase())}` : "",
    freshness ? `Overall, ${freshness.replace(/^\w/, (letter) => letter.toLowerCase())}` : ""
  ]
    .filter(Boolean)
    .slice(0, 4)
    .map(ensureSentence);

  return sentences.join(" ");
}

export function buildReportCardViewModel(result: JudgeProjectResponse): ReportCardViewModel {
  return {
    grade: result.analysis.scores.overallGrade,
    summary: buildSummary(result),
    familyHeadline: result.panel.familyHeadline,
    auntyQuestions: result.panel.aunty.data?.questions ?? []
  };
}
