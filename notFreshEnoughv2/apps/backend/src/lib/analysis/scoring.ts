import type { TinyFishFinding } from "../schemas/tinyfish";
import { gradeForOverallScore } from "./grading";

type ScoreKey =
  | "clarity"
  | "completeness"
  | "differentiation"
  | "usability"
  | "technicalDepth"
  | "freshness";

const SCORE_BASELINES: Record<ScoreKey, number> = {
  clarity: 5.8,
  completeness: 5.6,
  differentiation: 5.2,
  usability: 5.5,
  technicalDepth: 5.4,
  freshness: 5.4
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

function clamp(value: number, min = 0, max = 10) {
  return Math.min(max, Math.max(min, Number(value.toFixed(1))));
}

function impactForFinding(finding: TinyFishFinding) {
  const base = finding.severity === "high" ? 2.6 : finding.severity === "medium" ? 1.5 : 0.7;

  if (finding.signal === "positive") {
    return base;
  }

  if (finding.signal === "negative") {
    return -base;
  }

  return 0;
}

export function buildScores(findings: TinyFishFinding[]) {
  const scores = { ...SCORE_BASELINES };
  let highNegativeCount = 0;
  let mediumNegativeCount = 0;
  let positiveCount = 0;

  for (const finding of findings) {
    const targets = SCORE_CATEGORY_MAP[finding.category];
    const impact = impactForFinding(finding) / targets.length;

    if (finding.signal === "negative") {
      if (finding.severity === "high") {
        highNegativeCount += 1;
      } else if (finding.severity === "medium") {
        mediumNegativeCount += 1;
      }
    }

    if (finding.signal === "positive") {
      positiveCount += 1;
    }

    for (const target of targets) {
      scores[target] = clamp(scores[target] + impact);
    }
  }

  const weightedAverage =
    (scores.clarity * 1.2 +
      scores.completeness * 1.2 +
      scores.differentiation * 1.0 +
      scores.usability * 1.1 +
      scores.technicalDepth * 1.15 +
      scores.freshness * 0.95) /
    6.6;
  const flawPenalty = highNegativeCount * 0.45 + mediumNegativeCount * 0.18;
  const positiveBonus = Math.min(0.35, positiveCount * 0.05);
  const overall = clamp(
    weightedAverage - flawPenalty + positiveBonus
  );

  return {
    ...scores,
    overall,
    overallGrade: gradeForOverallScore(overall)
  };
}
