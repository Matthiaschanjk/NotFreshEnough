import type { AnalysisPoint, SharedProjectAnalysis } from "../schemas/analysis";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/judges?\s+may\s+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length > 2));
}

function overlapScore(left: string, right: string) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.min(leftTokens.size, rightTokens.size);
}

function isJudgeConcernLike(point: AnalysisPoint) {
  return /\bjudges?\b|confidence|verify|hesitate|question|doubt|score|evaluation|grasp/i.test(
    `${point.title} ${point.detail}`
  );
}

function dedupePoints(points: AnalysisPoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = `${normalizeText(point.title)}|${normalizeText(point.detail)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function rewriteWeakPointAsJudgeConcern(point: AnalysisPoint): AnalysisPoint {
  const text = `${point.title} ${point.detail}`;

  if (/usage|run|setup|use the product|workflow|onboard/i.test(text)) {
    return {
      title: "Judges may struggle to verify usability quickly",
      detail: "The current public materials do not make the usage flow easy to confirm, which can lower confidence in completeness.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  if (/demo|walkthrough|preview|screenshot/i.test(text)) {
    return {
      title: "Judges may question whether the product works end to end",
      detail: "Without a clear demo surface, reviewers may hesitate to reward the project because the claimed workflow is harder to verify.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  if (/architecture|repo structure|implementation|technical|few implementation details|internals/i.test(text)) {
    return {
      title: "Judges may doubt technical depth",
      detail: "Sparse implementation detail makes it harder to assess how substantial the build is, which can weaken technical scoring.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  if (/differentiat|novel|why it matters|positioning|judge-facing|context/i.test(text)) {
    return {
      title: "Judges may fail to grasp the project's value quickly",
      detail: "If differentiation is not made explicit, the project can feel less memorable during short evaluation windows.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  if (/readme|docs|documentation|instructions/i.test(text)) {
    return {
      title: "Judges may struggle to audit the submission efficiently",
      detail: "Thin documentation slows verification and can reduce confidence that the project is complete and reproducible.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  if (/metric|evaluation|benchmark|data|evidence/i.test(text)) {
    return {
      title: "Judges may be unsure how to validate the claimed results",
      detail: "Limited evaluation evidence makes the project harder to score confidently against stronger submissions.",
      severity: point.severity,
      evidenceIds: point.evidenceIds
    };
  }

  return {
    title: "Judges may question readiness",
    detail: "This visible weakness can reduce confidence in the project's completeness and make judges more cautious during scoring.",
    severity: point.severity,
    evidenceIds: point.evidenceIds
  };
}

export function ensureDistinctJudgeConcerns(
  weakPoints: AnalysisPoint[],
  judgeConcerns: AnalysisPoint[]
) {
  const rewritten = judgeConcerns.map((concern, index) => {
    const matchingWeakPoint =
      weakPoints.find((weakPoint) => {
        const titleOverlap = overlapScore(weakPoint.title, concern.title);
        const detailOverlap = overlapScore(weakPoint.detail, concern.detail);
        const fullOverlap = overlapScore(
          `${weakPoint.title} ${weakPoint.detail}`,
          `${concern.title} ${concern.detail}`
        );

        return titleOverlap >= 0.7 || detailOverlap >= 0.7 || fullOverlap >= 0.6;
      }) ?? weakPoints[index];

    if (!matchingWeakPoint) {
      return isJudgeConcernLike(concern) ? concern : rewriteWeakPointAsJudgeConcern(concern);
    }

    if (
      normalizeText(concern.title) === normalizeText(matchingWeakPoint.title) ||
      normalizeText(concern.detail) === normalizeText(matchingWeakPoint.detail) ||
      overlapScore(`${concern.title} ${concern.detail}`, `${matchingWeakPoint.title} ${matchingWeakPoint.detail}`) >= 0.6 ||
      !isJudgeConcernLike(concern)
    ) {
      return rewriteWeakPointAsJudgeConcern(matchingWeakPoint);
    }

    return concern;
  });

  return dedupePoints(rewritten);
}

export function ensureDistinctAnalysisSections(analysis: SharedProjectAnalysis): SharedProjectAnalysis {
  const normalizedJudgeConcerns = ensureDistinctJudgeConcerns(analysis.weakPoints, analysis.judgeConcerns);

  return {
    ...analysis,
    judgeConcerns: normalizedJudgeConcerns.slice(0, 4)
  };
}

