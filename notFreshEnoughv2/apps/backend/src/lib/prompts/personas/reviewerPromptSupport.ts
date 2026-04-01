import type { SharedProjectAnalysis } from "../../schemas/analysis";

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findTopReadmeParagraph(analysis: SharedProjectAnalysis) {
  const readmeSourceIds = new Set(
    analysis.sourcesInspected
      .filter((source) => source.surfaceType === "readme" || /readme/i.test(source.label))
      .map((source) => source.id)
  );

  const readmeEvidence =
    analysis.evidence.find((item) => item.sourceIds.some((id) => readmeSourceIds.has(id)) && item.excerpt) ??
    analysis.evidence.find((item) => item.sourceIds.some((id) => readmeSourceIds.has(id)));

  return collapseWhitespace(readmeEvidence?.excerpt ?? readmeEvidence?.detail ?? analysis.summary);
}

function inferDemoPresence(analysis: SharedProjectAnalysis) {
  const negativeSignals = [...analysis.weakPoints, ...analysis.missingElements].some((point) =>
    /(missing demo|no demo|live demo|demo link|walkthrough|preview)/i.test(`${point.title} ${point.detail}`)
  );

  if (negativeSignals) {
    return false;
  }

  return (
    analysis.sourcesInspected.some((source) => source.surfaceType === "demo" || /demo|preview|live/i.test(source.label)) ||
    analysis.evidence.some((item) => /demo|walkthrough|preview|live/i.test(`${item.title} ${item.detail} ${item.excerpt ?? ""}`))
  );
}

function inferDocsQuality(analysis: SharedProjectAnalysis) {
  if (analysis.scores.completeness >= 7.5) {
    return "high";
  }

  if (analysis.scores.completeness >= 5) {
    return "medium";
  }

  return "low";
}

export function buildReviewerEvidencePrompt(analysis: SharedProjectAnalysis) {
  return `Evidence: input_repo.description: "${collapseWhitespace(
    analysis.summary
  )}"; top README paragraph: "${findTopReadmeParagraph(analysis)}"; demo presence flag: ${
    inferDemoPresence(analysis) ? "true" : "false"
  }; docs_quality: ${inferDocsQuality(analysis)}. Now produce the three distinct items per the system prompt.`;
}

