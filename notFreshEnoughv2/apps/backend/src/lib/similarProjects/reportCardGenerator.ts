import type { SimilarProjectsResponse } from "./schema";

export const SINGLISH_REPORT_CARD_LINES = [
  "Walao, README sparse leh — need clearer examples and demo lah.",
  "Can still make it lah; add better docs and demo so judges understand lah.",
  "Ai yo, tests not enough leh — add CI and examples, then more shiok."
] as const;

export function generateSinglishReportCard(payload: SimilarProjectsResponse) {
  return {
    repoParagraphs: payload.results.map((_, index) => SINGLISH_REPORT_CARD_LINES[index % SINGLISH_REPORT_CARD_LINES.length]),
    overallJudgement: SINGLISH_REPORT_CARD_LINES[1],
    exampleLines: SINGLISH_REPORT_CARD_LINES
  };
}
