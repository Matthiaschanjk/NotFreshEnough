import { describe, expect, test } from "@jest/globals";
import { generateFamilyPanel } from "./generateFamilyPanel";
import { allocatePersonaFocus } from "./focusAllocator";
import { auntySystemPrompt, buildAuntyUserPrompt } from "../prompts/personas/auntyPrompt";
import {
  buildKorkorRecommendationsUserPrompt,
  korkorRecommendationsSystemPrompt
} from "../prompts/personas/korkorRecommendationsPrompt";
import type { SharedProjectAnalysis } from "../schemas/analysis";

function createAnalysis(overrides: Partial<SharedProjectAnalysis> = {}): SharedProjectAnalysis {
  return {
    projectName: "Project Atlas",
    summary: "Evidence-backed repo review assistant for hackathon judges.",
    sourcesInspected: [
      { id: "readme", label: "README", surfaceType: "readme", status: "ok" },
      { id: "demo", label: "Live Demo", surfaceType: "demo", status: "ok" }
    ],
    strongPoints: [
      {
        title: "Clear core value",
        detail: "The README explains the repo review flow with examples and public proof artifacts.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    weakPoints: [
      {
        title: "Architecture proof is thin",
        detail: "The public materials do not yet document the architecture and reproducibility path in one place.",
        severity: "medium",
        evidenceIds: ["readme"]
      },
      {
        title: "Scalability note is missing",
        detail: "Operational scaling assumptions are not stated in the current public materials.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    missingElements: [
      {
        title: "Evaluation baseline is missing",
        detail: "The README does not yet show a benchmark or baseline comparison for the judging workflow.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    judgeConcerns: [
      {
        title: "First-read orientation is weak",
        detail: "Judges still need a faster opening summary before they inspect the repo in detail.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    evidence: [
      {
        id: "e1",
        title: "README overview",
        detail: "The README includes setup, examples, and a walkthrough.",
        signal: "positive",
        sourceIds: ["readme"],
        excerpt: "Project Atlas reviews public repos, summarizes evidence, and helps judges inspect proof faster."
      }
    ],
    scores: {
      clarity: 6.2,
      completeness: 6.4,
      differentiation: 6.9,
      usability: 6.5,
      technicalDepth: 7.1,
      freshness: 6.8,
      overall: 6.6,
      overallGrade: "B-"
    },
    bestArtifactToRefurbish: {
      artifactType: "what judges should know section",
      reason: "The repo needs a faster first-read orientation."
    },
    freshnessNarrative: "Fresh enough.",
    ...overrides
  };
}

function countJudgeMentions(values: string[]) {
  return values.filter((value) => /\bjudge|judges|orientation\b/i.test(value)).length;
}

describe("generateFamilyPanel", () => {
  test("embeds the exact constructive reviewer prompt text", () => {
    const analysis = createAnalysis();
    const focusPlan = allocatePersonaFocus(analysis);

    expect(auntySystemPrompt).toContain(
      "You are a concise technical reviewer producing three distinct, constructive items for a software project."
    );
    expect(auntySystemPrompt).toContain("Each paragraph must be 1-2 sentences, preferably 20-35 words total");
    expect(korkorRecommendationsSystemPrompt).toContain(
      "Include at most one paragraph about Judge-facing clarity."
    );
    expect(buildAuntyUserPrompt(analysis, focusPlan)).toContain(
      "Now produce the three distinct items per the system prompt."
    );
    expect(buildKorkorRecommendationsUserPrompt(analysis, focusPlan)).toContain("docs_quality");
  });

  test("fallback mode returns exactly three distinct items with at most one judge-facing item", async () => {
    const analysis = createAnalysis();
    const focusPlan = allocatePersonaFocus(analysis);
    const panel = await generateFamilyPanel({
      analysis,
      focusPlan,
      client: null,
      model: "gpt-4.1-mini"
    });

    const auntyItems = panel.aunty.data?.questions ?? [];
    const recommendationTexts =
      panel.korkorRecommendations.data?.recommendations.map(
        (item) => `${item.issue} ${item.whyItMatters} ${item.concreteAction}`
      ) ?? [];

    expect(auntyItems).toHaveLength(3);
    expect(new Set(auntyItems).size).toBe(3);
    expect(countJudgeMentions(auntyItems)).toBeLessThanOrEqual(1);

    expect(recommendationTexts).toHaveLength(3);
    expect(new Set(recommendationTexts).size).toBe(3);
    expect(countJudgeMentions(recommendationTexts)).toBeLessThanOrEqual(1);
  });

  test("strong projects use risk or improvement fallback instead of synthesizing judge criticism", async () => {
    const analysis = createAnalysis({
      weakPoints: [
        {
          title: "Scaling note is missing",
          detail: "The repo does not yet explain traffic assumptions or maintenance boundaries.",
          severity: "medium",
          evidenceIds: ["readme"]
        }
      ],
      missingElements: [
        {
          title: "Benchmark appendix would help",
          detail: "A short benchmark appendix would make the evaluation claim easier to audit.",
          severity: "low",
          evidenceIds: ["readme"]
        }
      ],
      judgeConcerns: [
        {
          title: "Maintenance trade-offs need a short note",
          detail: "The public story is strong, but a maintenance note would make long-term risks easier to assess.",
          severity: "low",
          evidenceIds: ["readme"]
        }
      ],
      scores: {
        clarity: 8.4,
        completeness: 8.3,
        differentiation: 8.1,
        usability: 8.2,
        technicalDepth: 8.5,
        freshness: 8,
        overall: 8.3,
        overallGrade: "A-"
      }
    });
    const focusPlan = allocatePersonaFocus(analysis);
    const panel = await generateFamilyPanel({
      analysis,
      focusPlan,
      client: null,
      model: "gpt-4.1-mini"
    });

    const auntyItems = panel.aunty.data?.questions ?? [];
    const recommendationIssues = panel.korkorRecommendations.data?.recommendations.map((item) => item.issue) ?? [];

    expect(countJudgeMentions(auntyItems)).toBeLessThanOrEqual(1);
    expect(recommendationIssues.some((issue) => /Potential risk|Suggested improvement/i.test(issue))).toBe(true);
    expect(countJudgeMentions(recommendationIssues)).toBe(0);
  });
});
