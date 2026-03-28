import type { TinyFishFinding } from "../schemas/tinyfish";

type ScoreKey =
  | "clarity"
  | "completeness"
  | "differentiation"
  | "usability"
  | "technicalDepth"
  | "freshness";

const SCORE_BASELINES: Record<ScoreKey, number> = {
  clarity: 6.6,
  completeness: 6.4,
  differentiation: 6.0,
  usability: 6.2,
  technicalDepth: 6.0,
  freshness: 6.3
};

const SCORE_CATEGORY_MAP: Record<TinyFishFinding["category"], ScoreKey[]> = {
  clarity: ["clarity"],
  completeness: ["completeness"],
  differentiation: ["differentiation"],
  usability: ["usability"],
  "technical-depth": ["technicalDepth"],
  freshness: ["freshness"],
  proof: ["usability", "completeness"],
  consistency: ["clarity", "completeness"]
};

function clamp(value: number, min = 1, max = 10) {
  return Math.min(max, Math.max(min, Number(value.toFixed(1))));
}

function impactForFinding(finding: TinyFishFinding) {
  const base = finding.severity === "high" ? 2.2 : finding.severity === "medium" ? 1.25 : 0.65;

  if (finding.signal === "positive") {
    return base;
  }

  if (finding.signal === "negative") {
    return -base;
  }

  return 0;
}

export function gradeForOverallScore(overall: number) {
  if (overall >= 9.1) return "A";
  if (overall >= 8.6) return "A-";
  if (overall >= 8.1) return "B+";
  if (overall >= 7.4) return "B";
  if (overall >= 6.8) return "B-";
  if (overall >= 6.2) return "C+";
  if (overall >= 5.5) return "C";
  if (overall >= 4.8) return "C-";
  if (overall >= 4.1) return "D";
  return "F";
}

export function buildScores(findings: TinyFishFinding[]) {
  const scores = { ...SCORE_BASELINES };

  for (const finding of findings) {
    const targets = SCORE_CATEGORY_MAP[finding.category];
    const impact = impactForFinding(finding) / targets.length;

    for (const target of targets) {
      scores[target] = clamp(scores[target] + impact);
    }
  }

  const overall = clamp(
    (scores.clarity +
      scores.completeness +
      scores.differentiation +
      scores.usability +
      scores.technicalDepth +
      scores.freshness) /
      6
  );

  return {
    ...scores,
    overall,
    overallGrade: gradeForOverallScore(overall)
  };
}
