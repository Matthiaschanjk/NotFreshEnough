import type { AnalysisPoint, SharedProjectAnalysis } from "../schemas/analysis";

const SEVERITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1
};

function dedupe(points: AnalysisPoint[]) {
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

function prioritize(points: AnalysisPoint[]) {
  return [...points].sort((left, right) => SEVERITY_WEIGHT[right.severity] - SEVERITY_WEIGHT[left.severity]);
}

export interface PersonaFocusPlan {
  aunty: AnalysisPoint[];
  ahGong: {
    strengths: AnalysisPoint[];
    risks: AnalysisPoint[];
  };
  recommendations: AnalysisPoint[];
  refurbished: {
    artifactType: SharedProjectAnalysis["bestArtifactToRefurbish"]["artifactType"];
    reason: string;
    sourceSnippet?: string;
    supportingWeaknesses: AnalysisPoint[];
  };
}

export function allocatePersonaFocus(analysis: SharedProjectAnalysis): PersonaFocusPlan {
  const risks = prioritize(dedupe([...analysis.weakPoints, ...analysis.missingElements, ...analysis.judgeConcerns]));
  const strengths = prioritize(dedupe(analysis.strongPoints));

  return {
    aunty: risks.slice(0, 3),
    ahGong: {
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 2)
    },
    recommendations: risks.slice(0, 3),
    refurbished: {
      artifactType: analysis.bestArtifactToRefurbish.artifactType,
      reason: analysis.bestArtifactToRefurbish.reason,
      sourceSnippet: analysis.bestArtifactToRefurbish.sourceSnippet,
      supportingWeaknesses: risks.slice(0, 2)
    }
  };
}
