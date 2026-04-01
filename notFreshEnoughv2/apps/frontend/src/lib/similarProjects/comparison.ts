import type { SimilarProjectInputRepo, SimilarProjectResult, SimilarProjectsResponse } from "../../types/similarProjects";

export const REPORT_CARD_LINES = [
  "Walao, README sparse leh — need clearer examples and demo lah.",
  "Can still make it lah; add better docs and demo so judges understand lah.",
  "Ai yo, tests not enough leh — add CI and examples, then more shiok."
] as const;

const MISSING_REPO = "Not clearly documented in the public repo";
const MISSING_DOCS = "Insufficient public evidence from README/docs";
const MISSING_IMPL = "Implementation details not exposed in public materials";
const MAX_STANDARD = 120;
const MAX_LONG = 220;
const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;

function normalizeText(value: string | undefined) {
  return (value ?? "")
    .replace(EMOJI_REGEX, "")
    .replace(/[#*_`>\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTerminal(value: string) {
  return value.replace(/[.;,:!?]+$/g, "").trim();
}

function truncateAtBoundary(value: string, maxLength: number) {
  const normalized = trimTerminal(normalizeText(value));
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return `${normalized}.`;
  }

  const candidate = normalized.slice(0, maxLength - 1);
  const boundary = candidate.lastIndexOf(" ");
  const shortened = boundary > 24 ? candidate.slice(0, boundary) : candidate;
  return `${trimTerminal(shortened)}…`;
}

function firstSentence(value: string | undefined, fallback: string, maxLength = MAX_STANDARD) {
  const sentence = normalizeText(value).split(/[.!?]/)[0] ?? "";
  return truncateAtBoundary(sentence || fallback, maxLength);
}

function buildAssessment(parts: Array<string | undefined>, fallback: string, maxLength = MAX_LONG) {
  const joined = parts.filter(Boolean).join(" ");
  return truncateAtBoundary(joined || fallback, maxLength);
}

function classifySimilarity(score: number) {
  if (score >= 0.8) return "High";
  if (score >= 0.55) return "Moderate";
  if (score > 0) return "Low";
  return "Inconclusive";
}

function deriveWorkflow(
  language: string | undefined,
  docsQuality: SimilarProjectResult["docs_quality"] | "med",
  topics: string[],
  evidenceSource: string
) {
  const loweredTopics = topics.map((topic) => topic.toLowerCase());
  const evidenceClause = docsQuality === "low" ? `(Inferred from: ${evidenceSource})` : `(Based on: ${evidenceSource})`;

  if (loweredTopics.some((topic) => topic.includes("workflow"))) {
    return truncateAtBoundary(`Processes repo materials → applies visible checks → Outputs: evaluation notes. ${evidenceClause}`, 140);
  }

  if (language && docsQuality !== "low") {
    return truncateAtBoundary(`${language} flow reads public materials → runs visible steps → Outputs: software artifact. ${evidenceClause}`, 140);
  }

  if (language) {
    return truncateAtBoundary(`${language} flow is inferred from public structure → Outputs: implementation artifact. ${evidenceClause}`, 140);
  }

  return truncateAtBoundary(`Public materials imply a simple pipeline → Outputs: documented result. ${evidenceClause}`, 140);
}

function deriveTechStack(languages: string[], primaryLanguage?: string) {
  if (languages.length > 0) {
    return truncateAtBoundary(`${languages.slice(0, 3).join(", ")} appear in public stack signals`, MAX_STANDARD);
  }

  if (primaryLanguage) {
    return truncateAtBoundary(`${primaryLanguage} appears as the primary implementation language`, MAX_STANDARD);
  }

  return `${MISSING_IMPL}.`;
}

export function buildComparisonRows(inputRepo: SimilarProjectInputRepo, result: SimilarProjectResult) {
  const similarityLevel = classifySimilarity(result.similarity_score);

  return [
    {
      feature: "Use case",
      inputRepo: firstSentence(inputRepo.description, MISSING_REPO),
      cousinRepo: firstSentence(result.one_line_description, MISSING_REPO),
      assessment: buildAssessment(
        ["Related public problem space.", "Purpose overlap is the clearest shared signal."],
        `${MISSING_DOCS}; limits confidence in problem overlap.`
      )
    },
    {
      feature: "Workflow",
      inputRepo: deriveWorkflow(inputRepo.languages[0], "med", inputRepo.topics, "README"),
      cousinRepo: deriveWorkflow(
        result.primary_language,
        result.docs_quality,
        result.topic_overlap,
        result.source === "devpost" ? "Devpost listing" : result.source === "linkedin" ? "public listing" : "README"
      ),
      assessment: buildAssessment(
        [
          inputRepo.languages[0] === result.primary_language ? "Similar primary stack signals." : "Different primary stack signals.",
          "Pipeline differences affect implementation comparability."
        ],
        `${MISSING_DOCS}; limits confidence in workflow similarity.`
      )
    },
    {
      feature: "Tech stack",
      inputRepo: deriveTechStack(inputRepo.languages),
      cousinRepo: deriveTechStack([], result.primary_language),
      assessment:
        result.primary_language && inputRepo.languages.includes(result.primary_language)
          ? "Primary language overlap supports implementation similarity."
          : "Primary language signals differ, which lowers implementation confidence."
    },
    {
      feature: "Core differences",
      mergedAssessment: buildAssessment(
        [
          "Both projects target a related public problem.",
          inputRepo.languages[0] === result.primary_language
            ? `${result.primary_language} appears in both implementations, but the cousin changes delivery evidence.`
            : `${inputRepo.languages[0] ?? "The input stack"} and ${result.primary_language} point to different implementation paths.`,
          result.demo_url_present
            ? "This affects user impact because the cousin exposes a demo rather than the same documented pipeline."
            : "This affects substitutability because the cousin exposes less public implementation evidence."
        ],
        `${MISSING_IMPL}; limits confidence in substantive differentiation.`
      ),
      merged: true
    },
    {
      feature: "Overall similarity level",
      mergedAssessment: buildAssessment(
        [
          `${similarityLevel} —`,
          result.similarity_score >= 0.8
            ? "public purpose, workflow, and evidence signals align closely (Based on: README and listing)."
            : result.similarity_score >= 0.55
              ? "public purpose overlaps, but implementation evidence is mixed (Based on: README and listing)."
              : result.similarity_score > 0
                ? "some public overlap exists, but evidence points to a different implementation or scope (Based on: README and listing)."
                : `${MISSING_DOCS}; limits confidence in overall similarity.`
        ],
        `${MISSING_DOCS}; limits confidence in overall similarity.`
      ),
      merged: true
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
