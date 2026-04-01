import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { FishMascot } from "./FishMascot";
import { ResultsReport } from "./ResultsReport";
import type { JudgeProjectResponse } from "../types/judgement";
import { buildReportCardViewModel } from "../lib/reportCardAdapter";

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
    familyHeadline: "Can see the effort already, but the weak spots still quite obvious leh.",
    statusLabel: "FAIL",
    aunty: {
      status: "ok",
      source: "fallback",
      data: {
        questions: [
          "Judge-facing clarity needs a faster opening. Add a one-paragraph summary near the top of the README.",
          "Technical robustness needs clearer proof. Document the architecture and one reproducible run path.",
          "Demo readiness can improve. Add a visible first-click path with one short walkthrough."
        ]
      }
    },
    ahGong: {
      status: "ok",
      source: "fallback",
      data: {
        verdict: "Jialat",
        explanation: "Can tell there was effort, but judges may still find the public story shaky leh.",
        closingLine: "Got chance to recover, but right now still quite jialat leh."
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
            whyItMatters: "Judges need a fast understanding of the project before they inspect details.",
            concreteAction: "Add a one-paragraph 'What Judges Should Know' section near the top of the README."
          },
          {
            priority: 2,
            issue: "Demo readiness",
            whyItMatters: "A visible proof surface makes the value easier to validate quickly.",
            concreteAction: "Ship a short walkthrough or live demo link at the top of the repo."
          },
          {
            priority: 3,
            issue: "Technical robustness",
            whyItMatters: "The implementation needs one clear reproducible path for reviewers.",
            concreteAction: "Add one verified local run command and the expected output."
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
    expect(html.indexOf("Your Cousin&#x27;s Projects")).toBeLessThan(html.indexOf("Share your shame"));
  });

  test("renders exactly three distinct report card items and three distinct recommendations", () => {
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

    const reportItemCount = (html.match(/data-testid="report-card-item"/g) ?? []).length;
    const recommendationCount = (html.match(/data-testid="korkor-recommendation"/g) ?? []).length;
    const reportItems = mockResult.panel.aunty.data?.questions ?? [];
    const recommendationItems =
      mockResult.panel.korkorRecommendations.data?.recommendations.map(
        (item) => `${item.issue} ${item.whyItMatters} ${item.concreteAction}`
      ) ?? [];
    const countJudgeItems = (items: string[]) =>
      items.filter((item) => /\bjudge|judges|orientation\b/i.test(item)).length;
    const renderedReportCardItems = html.match(/<article data-testid="report-card-item"[\s\S]*?<\/article>/g) ?? [];

    expect(reportItemCount).toBe(3);
    expect(recommendationCount).toBe(3);
    expect(new Set(reportItems).size).toBe(3);
    expect(new Set(recommendationItems).size).toBe(3);
    expect(countJudgeItems(reportItems)).toBeLessThanOrEqual(1);
    expect(countJudgeItems(recommendationItems)).toBeLessThanOrEqual(1);
    expect(html).toContain("Judge-facing clarity: differentiation is not explicit");
    expect(html).toContain("Technical robustness: limited implementation vocabulary");
    expect(html).toContain("Demo and onboarding: a live surface exists");
    expect(renderedReportCardItems.join(" ")).not.toContain("Add a ");
    expect(renderedReportCardItems.join(" ")).not.toContain("Place a ");
  });

  test("keeps report card items compact and uses the wider summary layout", () => {
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

    const reportItems = (mockResult.panel.aunty.data?.questions ?? []).map((item) => item.replace(/\s+/g, " ").trim());
    const summarySentenceCount = (buildReportCardViewModel(mockResult).summary.match(/\./g) ?? []).length;

    expect(reportItems.every((item) => item.length <= 155)).toBe(true);
    expect(html).toContain("max-w-[44rem]");
    expect(html).toContain("max-w-[46rem]");
    expect(summarySentenceCount).toBeGreaterThanOrEqual(4);
  });

  test("does not render the removed report-card highlighted line", () => {
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

    expect(html).not.toContain("AH GONG IS WAITING");
    expect(html).toContain("You have disappointed your family.");
  });

  test("uses the new fish image with TinyFish logo alt text", () => {
    const html = renderToStaticMarkup(<FishMascot />);
    expect(html).toContain('alt="TinyFish logo"');
    expect(html).toContain("test-file-stub");
  });
});
