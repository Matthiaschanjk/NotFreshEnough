import type { JudgeProjectResponse } from "../types/judgement";

export interface ReportCardViewModel {
  grade: string;
  summary: string;
  familyHeadline: string;
  auntyQuestions: string[];
}

export function buildReportCardViewModel(result: JudgeProjectResponse): ReportCardViewModel {
  return {
    grade: result.analysis.scores.overallGrade,
    summary: result.analysis.summary,
    familyHeadline: result.panel.familyHeadline,
    auntyQuestions: result.panel.aunty.data?.questions ?? []
  };
}
