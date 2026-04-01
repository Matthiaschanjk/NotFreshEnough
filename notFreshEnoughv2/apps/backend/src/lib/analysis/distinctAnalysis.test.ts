import { describe, expect, test } from "@jest/globals";
import { ensureDistinctJudgeConcerns, rewriteWeakPointAsJudgeConcern } from "./distinctAnalysis";
import { buildHeuristicAnalysis } from "./heuristicAnalysis";
import type { AnalysisPoint } from "../schemas/analysis";
import type { JudgeProjectInput } from "../schemas/input";
import type { TinyFishInvestigationResult } from "../schemas/tinyfish";

describe("distinct analysis sections", () => {
  test("rewrites overlapping judge concerns into judge-facing implications", () => {
    const weakPoint: AnalysisPoint = {
      title: "Usage flow is under-explained",
      detail: "The README does not clearly show how a user is supposed to run or use the product.",
      severity: "medium",
      evidenceIds: ["readme"]
    };

    const normalized = ensureDistinctJudgeConcerns(weakPoint ? [weakPoint] : [], [
      {
        title: "Usage flow is under-explained",
        detail: "The README does not clearly show how a user is supposed to run or use the product.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.title).not.toBe(weakPoint.title);
    expect(normalized[0]?.detail).not.toBe(weakPoint.detail);
    expect(normalized[0]?.title).toMatch(/^Judges may/i);
  });

  test("creates judge concerns from weak points with evaluation-oriented wording", () => {
    const concern = rewriteWeakPointAsJudgeConcern({
      title: "Few implementation details are exposed",
      detail: "The repo does not explain the architecture or internal workflow in enough detail.",
      severity: "high",
      evidenceIds: ["repo"]
    });

    expect(concern.title).toMatch(/^Judges may/i);
    expect(concern.detail).toMatch(/confidence|score|assess|verify/i);
  });

  test("heuristic analysis keeps weak points and judge concerns distinct", () => {
    const input: JudgeProjectInput = {
      repoUrl: "https://github.com/acme/project",
      demoUrl: undefined,
      submissionUrl: undefined,
      projectBlurb: "Hackathon helper"
    };
    const investigation: TinyFishInvestigationResult = {
      repo: {
        owner: "acme",
        name: "project",
        fullName: "acme/project",
        url: "https://github.com/acme/project",
        description: "Hackathon helper",
        languages: ["TypeScript"],
        stars: 4,
        openIssues: 0,
        topics: ["hackathon"],
        pushedAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z"
      },
      surfaces: [
        {
          id: "repo",
          surfaceType: "repo",
          label: "GitHub repo",
          url: "https://github.com/acme/project",
          status: "ok",
          notes: []
        },
        {
          id: "readme",
          surfaceType: "readme",
          label: "README",
          url: "https://github.com/acme/project#readme",
          status: "ok",
          notes: []
        }
      ],
      findings: [
        {
          id: "f1",
          category: "usability",
          signal: "negative",
          severity: "medium",
          title: "Usage flow is under-explained",
          detail: "The README does not clearly show how a user is supposed to run or use the product.",
          sourceIds: ["readme"],
          evidenceSnippet: "No clear usage instructions were found."
        },
        {
          id: "f2",
          category: "technical-depth",
          signal: "negative",
          severity: "medium",
          title: "Few implementation details are exposed",
          detail: "The repo does not explain the architecture or internal workflow in enough detail.",
          sourceIds: ["repo"],
          evidenceSnippet: "Implementation details are sparse."
        },
        {
          id: "f3",
          category: "clarity",
          signal: "positive",
          severity: "low",
          title: "Problem statement is visible",
          detail: "The project states what problem it is trying to solve.",
          sourceIds: ["readme"],
          evidenceSnippet: "A brief project summary is visible."
        }
      ],
      candidateArtifacts: [],
      metadata: {
        investigationMode: "mock",
        inspectedAt: "2026-03-31T00:00:00.000Z",
        warnings: [],
        partialFailures: []
      }
    };

    const analysis = buildHeuristicAnalysis(input, investigation);

    for (const concern of analysis.judgeConcerns) {
      expect(concern.title).toMatch(/^Judges may/i);
      expect(
        analysis.weakPoints.some(
          (weakPoint) =>
            weakPoint.title.toLowerCase() === concern.title.toLowerCase() ||
            weakPoint.detail.toLowerCase() === concern.detail.toLowerCase()
        )
      ).toBe(false);
    }
  });
});
