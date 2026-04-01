import type { JudgeProjectInput } from "../schemas/input";
import { SharedProjectAnalysisSchema, type AnalysisPoint, type SharedProjectAnalysis } from "../schemas/analysis";
import type { TinyFishFinding, TinyFishInvestigationResult } from "../schemas/tinyfish";
import { buildScores } from "./scoring";
import { ensureDistinctAnalysisSections, rewriteWeakPointAsJudgeConcern } from "./distinctAnalysis";

function sanitizeExcerpt(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function mapFindingToPoint(finding: TinyFishFinding): AnalysisPoint {
  return {
    title: finding.title,
    detail: finding.detail,
    severity: finding.severity,
    evidenceIds: finding.sourceIds
  };
}

function uniquePoints(points: AnalysisPoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = point.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareSeverity(left: AnalysisPoint, right: AnalysisPoint) {
  const weight = {
    high: 3,
    medium: 2,
    low: 1
  };

  return weight[right.severity] - weight[left.severity];
}

function freshnessNarrative(score: number) {
  if (score >= 7.6) {
    return "TinyFish found enough recent movement that the project still smells freshly handled.";
  }

  if (score >= 5.8) {
    return "TinyFish found some movement, but the surface still feels a bit yesterday-fish rather than same-day-fish.";
  }

  return "TinyFish thinks the public surface smells stale, mostly because key proof points or recent signals are missing.";
}

export function buildHeuristicAnalysis(
  input: JudgeProjectInput,
  investigation: TinyFishInvestigationResult
): SharedProjectAnalysis {
  const scores = buildScores(investigation.findings);
  const positiveFindings = investigation.findings.filter((finding) => finding.signal === "positive");
  const negativeFindings = investigation.findings.filter((finding) => finding.signal === "negative");
  const strengths = uniquePoints(positiveFindings.map(mapFindingToPoint)).slice(0, 4);
  const weaknesses = uniquePoints(negativeFindings.map(mapFindingToPoint)).sort(compareSeverity).slice(0, 5);
  const missingElements = weaknesses
    .filter((point) =>
      /missing|not obvious|not found|under-explained|too thin|proof/i.test(`${point.title} ${point.detail}`)
    )
    .slice(0, 4);

  const judgeConcerns = uniquePoints(
    weaknesses
      .filter((point) => point.severity !== "low")
      .map(rewriteWeakPointAsJudgeConcern)
      .concat(
        scores.freshness < 6
          ? [
              {
                title: "Judges may question project momentum",
                detail: "Limited recent proof can make the project feel less ready, which may lower confidence during evaluation.",
                severity: "medium",
                evidenceIds: []
              }
            ]
          : []
      )
  )
    .sort(compareSeverity)
    .slice(0, 4);

  const bestArtifact = investigation.candidateArtifacts[0];
  const topStrength = strengths[0]?.detail ?? "there is enough material to inspect the project";
  const topRisk = weaknesses[0]?.detail ?? "the public-facing story still needs tightening";
  const weaknessLabel =
    weaknesses.length > 0
      ? weaknesses
          .slice(0, 2)
          .map((point) => point.title.toLowerCase())
          .join(" and ")
      : "public clarity and demo proof";
  const projectName = investigation.repo.name;

  const parsed = SharedProjectAnalysisSchema.parse({
    projectName,
    summary: `${projectName} shows enough signal that judges can understand the idea, but TinyFish found weak spots around ${weaknessLabel}. The upside is that ${topStrength.toLowerCase()}, while the main risk is that ${topRisk.toLowerCase()}.`,
    sourcesInspected: investigation.surfaces.map((surface) => ({
      id: surface.id,
      label: surface.label,
      surfaceType: surface.surfaceType,
      status: surface.status,
      url: surface.url
    })),
    strongPoints:
      strengths.length > 0
        ? strengths
        : [
            {
              title: "TinyFish found at least one inspectable surface",
              detail: "Even limited public artifacts are better than a completely opaque submission.",
              severity: "low",
              evidenceIds: investigation.surfaces.map((surface) => surface.id).slice(0, 2)
            }
          ],
    weakPoints:
      weaknesses.length > 0
        ? weaknesses
        : [
            {
              title: "Project story needs more visible proof",
              detail: "The available surfaces are too thin to impress a judge quickly.",
              severity: "medium",
              evidenceIds: investigation.surfaces.map((surface) => surface.id).slice(0, 2)
            }
          ],
    missingElements,
    judgeConcerns:
      judgeConcerns.length > 0
        ? judgeConcerns
        : [
            {
              title: "Judge confidence could wobble",
              detail: "The project needs a tighter public story to avoid feeling under-prepared.",
              severity: "medium",
              evidenceIds: []
            }
          ],
    evidence: investigation.findings.slice(0, 8).map((finding) => ({
      id: finding.id,
      title: finding.title,
      detail: finding.detail,
      signal: finding.signal,
      sourceIds: finding.sourceIds,
      excerpt: sanitizeExcerpt(finding.evidenceSnippet)
    })),
    scores,
    bestArtifactToRefurbish: {
      artifactType: bestArtifact?.artifactType ?? "project summary",
      reason:
        bestArtifact?.rationale ??
        "The public story needs one clearer artifact that a judge can understand in a single glance.",
      sourceSnippet: bestArtifact?.currentSnippet ?? input.projectBlurb ?? investigation.repo.description ?? undefined
    },
    freshnessNarrative: freshnessNarrative(scores.freshness)
  });

  return ensureDistinctAnalysisSections(parsed);
}
