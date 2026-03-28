import type { SimilarProjectInputRepo, SimilarProjectResult, SimilarProjectsResponse } from "../../types/similarProjects";

export const REPORT_CARD_LINES = [
  "Walao, README sparse leh — need clearer examples and demo lah.",
  "Can still make it lah; add better docs and demo so judges understand lah.",
  "Ai yo, tests not enough leh — add CI and examples, then more shiok."
] as const;

export function buildComparisonRows(inputRepo: SimilarProjectInputRepo, result: SimilarProjectResult) {
  const sharedLanguages = inputRepo.languages.filter((language) => language === result.primary_language);

  return [
    {
      label: "Similarity Score",
      inputValue: "Baseline repository",
      candidateValue: result.similarity_score.toFixed(2),
      explanation:
        result.similarity_score > 0.8
          ? "This project is highly comparable based on repository text and metadata."
          : "This project shares some overlap but remains meaningfully differentiated."
    },
    {
      label: "Primary Language",
      inputValue: inputRepo.languages[0] ?? "Unknown",
      candidateValue: result.primary_language,
      explanation:
        sharedLanguages.length > 0
          ? `Both repositories rely on ${sharedLanguages.join(", ")} as a primary technology choice.`
          : `The repositories prioritize different primary languages.`
    },
    {
      label: "Stars",
      inputValue: String(inputRepo.stars),
      candidateValue: String(result.stars),
      explanation:
        result.stars > inputRepo.stars
          ? "This result currently has stronger public adoption by star count."
          : "This result has lower or comparable public adoption."
    },
    {
      label: "Topic Overlap",
      inputValue: inputRepo.topics.join(", ") || "None",
      candidateValue: result.topic_overlap.join(", ") || "None",
      explanation:
        result.topic_overlap.length > 0
          ? `Shared topics: ${result.topic_overlap.join(", ")}.`
          : "No explicit shared topics were detected from repository metadata."
    },
    {
      label: "Demo URL Present",
      inputValue: "Not evaluated",
      candidateValue: result.demo_url_present ? "Yes" : "No",
      explanation: result.demo_url_present ? "A public demo URL is available." : "No public demo URL was detected."
    },
    {
      label: "Docs Quality",
      inputValue: "Input repository baseline",
      candidateValue: result.docs_quality,
      explanation:
        result.docs_quality === "high"
          ? "Documentation appears thorough and usage-oriented."
          : result.docs_quality === "med"
            ? "Documentation is usable but may benefit from stronger examples."
            : "Documentation appears limited and may slow evaluation."
    }
  ];
}

export function generateReportCard(payload: SimilarProjectsResponse) {
  return {
    repoParagraphs: payload.results.map((_, index) => REPORT_CARD_LINES[index % REPORT_CARD_LINES.length]),
    overallJudgement: REPORT_CARD_LINES[1],
    exampleLines: REPORT_CARD_LINES
  };
}
