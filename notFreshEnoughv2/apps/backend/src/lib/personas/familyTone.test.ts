import { describe, expect, test } from "@jest/globals";
import { buildAhGongVerdictPayload, buildFamilyReactionLine, verdictForGrade } from "./familyTone";
import type { SharedProjectAnalysis } from "../schemas/analysis";
import { allocatePersonaFocus } from "./focusAllocator";

function createAnalysis(grade: SharedProjectAnalysis["scores"]["overallGrade"]): SharedProjectAnalysis {
  return {
    projectName: "Project Atlas",
    summary: "Repo review helper",
    sourcesInspected: [{ id: "readme", label: "README", surfaceType: "readme", status: "ok" }],
    strongPoints: [
      {
        title: "Core idea visible",
        detail: "The README explains the project purpose clearly to a first-time reader.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    weakPoints: [
      {
        title: "Usage flow is thin",
        detail: "The README does not clearly show how a user is supposed to run the product.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    missingElements: [],
    judgeConcerns: [
      {
        title: "Differentiation not explicit",
        detail: "Judges may need more help understanding why this project stands apart quickly.",
        severity: "medium",
        evidenceIds: ["readme"]
      }
    ],
    evidence: [],
    scores: {
      clarity: 7,
      completeness: 6,
      differentiation: 6,
      usability: 5,
      technicalDepth: 7,
      freshness: 8,
      overall: 6.4,
      overallGrade: grade
    },
    bestArtifactToRefurbish: {
      artifactType: "project summary",
      reason: "Needs clearer opening"
    },
    freshnessNarrative: "Fresh enough."
  };
}

describe("familyTone", () => {
  test("maps grades into the new Ah Gong verdict buckets", () => {
    expect(verdictForGrade("A")).toBe("Borderline");
    expect(verdictForGrade("B")).toBe("Borderline");
    expect(verdictForGrade("B-")).toBe("Jialat");
    expect(verdictForGrade("C")).toBe("Jialat");
    expect(verdictForGrade("C-")).toBe("Siao Liao");
    expect(verdictForGrade("F")).toBe("Siao Liao");
  });

  test("keeps the report-card family reaction distinct from the lower verdict headline", () => {
    const failing = buildFamilyReactionLine("B", createAnalysis("B"));
    const passing = buildFamilyReactionLine("A-", createAnalysis("A-"));

    expect(failing.toLowerCase()).not.toContain("you have disappointed your family");
    expect(passing.toLowerCase()).not.toContain("you have not disappointed your family");
    expect(failing).toMatch(/leh|lah|aiyoh|walao/i);
    expect(passing).toMatch(/leh|lah/i);
  });

  test("builds verdict text that changes meaningfully with severity", () => {
    const borderlineAnalysis = createAnalysis("A-");
    const jialatAnalysis = createAnalysis("C+");
    const siaoLiaoAnalysis = createAnalysis("D");

    const borderline = buildAhGongVerdictPayload(
      "A-",
      borderlineAnalysis,
      allocatePersonaFocus(borderlineAnalysis)
    );
    const jialat = buildAhGongVerdictPayload("C+", jialatAnalysis, allocatePersonaFocus(jialatAnalysis));
    const siaoLiao = buildAhGongVerdictPayload("D", siaoLiaoAnalysis, allocatePersonaFocus(siaoLiaoAnalysis));

    expect(borderline.verdict).toBe("Borderline");
    expect(jialat.verdict).toBe("Jialat");
    expect(siaoLiao.verdict).toBe("Siao Liao");
    expect(borderline.explanation).not.toBe(jialat.explanation);
    expect(jialat.explanation).not.toBe(siaoLiao.explanation);
  });
});
