import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { TinyFishFindings } from "./TinyFishFindings";
import type { SharedProjectAnalysis } from "../types/judgement";

const analysis: SharedProjectAnalysis = {
  projectName: "Project",
  summary: "Project summary",
  sourcesInspected: [{ id: "repo", label: "GitHub repository", surfaceType: "repo", status: "ok" }],
  strongPoints: [
    { title: "Clear value", detail: "The repository metadata explains the project clearly.", severity: "medium", evidenceIds: ["repo"] }
  ],
  weakPoints: [
    { title: "Thin demo context", detail: "The demo lacks deeper explanation.", severity: "medium", evidenceIds: ["repo"] }
  ],
  missingElements: [],
  judgeConcerns: [
    { title: "Judges may hesitate", detail: "Verification is slower without stronger proof.", severity: "medium", evidenceIds: ["repo"] }
  ],
  evidence: [
    {
      id: "negative-1",
      title: "Usage flow is under-explained",
      detail: "The README does not clearly show how the product is supposed to be used.",
      signal: "negative",
      sourceIds: ["repo"]
    },
    {
      id: "positive-1",
      title: "Project intent appears quickly",
      detail: "The repository metadata gives judges an immediate first-pass understanding of the project.",
      signal: "positive",
      sourceIds: ["repo"]
    },
    {
      id: "positive-2",
      title: "README has enough material to inspect",
      detail: "There is enough README substance for judges to inspect product intent and implementation shape.",
      signal: "positive",
      sourceIds: ["repo"]
    }
  ],
  scores: {
    clarity: 7,
    completeness: 6,
    differentiation: 6,
    usability: 5,
    technicalDepth: 7,
    freshness: 5,
    overall: 6.2,
    overallGrade: "B-"
  },
  bestArtifactToRefurbish: {
    artifactType: "project summary",
    reason: "Needs clearer summary"
  },
  freshnessNarrative: "Fresh enough."
};

describe("TinyFishFindings", () => {
  test("renders positive evidence before negative evidence", () => {
    const html = renderToStaticMarkup(<TinyFishFindings analysis={analysis} warnings={[]} />);

    expect(html.indexOf("Project intent appears quickly")).toBeLessThan(html.indexOf("Usage flow is under-explained"));
    expect(html.indexOf("README has enough material to inspect")).toBeLessThan(html.indexOf("Usage flow is under-explained"));
    expect(html).toContain('data-testid="evidence-positive"');
    expect(html).toContain('data-testid="evidence-negative"');
  });
});

