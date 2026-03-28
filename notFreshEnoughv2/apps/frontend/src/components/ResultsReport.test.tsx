import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { FishMascot } from "./FishMascot";
import { ResultsReport } from "./ResultsReport";
import type { JudgeProjectResponse } from "../types/judgement";

const mockResult: JudgeProjectResponse = {
  requestId: "judge_123",
  generatedAt: "2026-03-28T00:00:00.000Z",
  inputEcho: {
    repoUrl: "https://github.com/acme/project"
  },
  analysis: {
    projectName: "Project",
    summary: "Project summary",
    sourcesInspected: [
      {
        id: "source_1",
        label: "README",
        surfaceType: "readme",
        status: "ok"
      }
    ],
    strongPoints: [
      {
        title: "Clear value",
        detail: "The project explains its purpose clearly.",
        severity: "medium",
        evidenceIds: ["source_1"]
      }
    ],
    weakPoints: [
      {
        title: "Missing demo",
        detail: "There is no live demo yet.",
        severity: "high",
        evidenceIds: ["source_1"]
      }
    ],
    missingElements: [
      {
        title: "Judge summary missing",
        detail: "The project needs a concise judge-facing summary.",
        severity: "medium",
        evidenceIds: ["source_1"]
      }
    ],
    judgeConcerns: [
      {
        title: "Momentum unclear",
        detail: "Recent activity is not obvious.",
        severity: "medium",
        evidenceIds: ["source_1"]
      }
    ],
    evidence: [
      {
        id: "evidence_1",
        title: "README has enough material to inspect",
        detail: "The README is substantive.",
        signal: "positive",
        sourceIds: ["source_1"],
        excerpt: "Readable excerpt."
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
  },
  tinyFish: {
    investigationMode: "mock",
    warnings: [],
    sourcesInspected: 1
  },
  panel: {
    familyHeadline: "Family unconvinced, but not yet disowning the repo.",
    statusLabel: "FAIL",
    aunty: {
      status: "ok",
      source: "fallback",
      data: {
        questions: ["Why so hard to understand lah?"]
      }
    },
    ahGong: {
      status: "ok",
      source: "fallback",
      data: {
        verdict: "Borderline",
        explanation: "Aiyo, got potential lah.",
        closingLine: "Can eat lah, but still cannot brag."
      }
    },
    korkorRecommendations: {
      status: "ok",
      source: "fallback",
      data: {
        recommendations: [
          {
            priority: 1,
            issue: "Missing judge-facing context",
            whyItMatters: "Judges need context.",
            concreteAction: "Add a better summary."
          },
          {
            priority: 2,
            issue: "No demo",
            whyItMatters: "No proof.",
            concreteAction: "Ship a demo."
          },
          {
            priority: 3,
            issue: "Thin examples",
            whyItMatters: "Examples help.",
            concreteAction: "Add examples."
          }
        ]
      }
    },
    korkorRefurbished: {
      status: "ok",
      source: "fallback",
      data: {
        artifactType: "project summary",
        reason: "Needs polish",
        title: "Project summary",
        content: "Summary content"
      }
    }
  }
};

describe("ResultsReport", () => {
  test("renders report card before stats and personas", () => {
    const html = renderToStaticMarkup(
      <ResultsReport
        result={mockResult}
        similarProjects={null}
        isLoadingSimilarProjects={false}
        onShare={() => undefined}
        shareStatusMessage={null}
        isSharing={false}
      />
    );

    expect(html.indexOf("Report Card")).toBeLessThan(html.indexOf("Clarity"));
    expect(html.indexOf("Clarity")).toBeLessThan(html.indexOf("Ah Gong&#x27;s Verdict"));
    expect(html.indexOf("Korkor&#x27;s Recommendations")).toBeLessThan(html.indexOf("Your Cousin&#x27;s Projects"));
    expect(html.indexOf("Your Cousin&#x27;s Projects")).toBeLessThan(html.indexOf("Share your Shame"));
  });

  test("uses the new fish image with TinyFish logo alt text", () => {
    const html = renderToStaticMarkup(<FishMascot />);
    expect(html).toContain('alt="TinyFish logo"');
    expect(html).toContain("test-file-stub");
  });
});
