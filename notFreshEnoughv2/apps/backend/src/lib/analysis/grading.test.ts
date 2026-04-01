import { describe, expect, test } from "@jest/globals";
import { buildScores } from "./scoring";
import { gradeForOverallScore, isPassingGrade } from "./grading";
import type { TinyFishFinding } from "../schemas/tinyfish";

describe("grading", () => {
  test("supports the full grade scale and passes only at A- or above", () => {
    expect(gradeForOverallScore(9.6)).toBe("A+");
    expect(gradeForOverallScore(9.1)).toBe("A");
    expect(gradeForOverallScore(8.5)).toBe("A-");
    expect(gradeForOverallScore(8.1)).toBe("B+");
    expect(gradeForOverallScore(7.2)).toBe("B");
    expect(gradeForOverallScore(6.7)).toBe("B-");
    expect(gradeForOverallScore(4.2)).toBe("D+");
    expect(gradeForOverallScore(2.4)).toBe("D-");
    expect(gradeForOverallScore(1.8)).toBe("F");

    expect(isPassingGrade("A+")).toBe(true);
    expect(isPassingGrade("A")).toBe(true);
    expect(isPassingGrade("A-")).toBe(true);
    expect(isPassingGrade("B+")).toBe(false);
    expect(isPassingGrade("B")).toBe(false);
  });

  test("penalizes multiple serious flaws enough to keep the grade below the pass range", () => {
    const findings: TinyFishFinding[] = [
      {
        id: "f1",
        category: "clarity",
        signal: "negative",
        severity: "high",
        title: "Judge-facing context is missing",
        detail: "The repo does not explain why the project matters.",
        sourceIds: ["readme"]
      },
      {
        id: "f2",
        category: "usability",
        signal: "negative",
        severity: "high",
        title: "Usage flow is under-explained",
        detail: "The README does not clearly show how the product is supposed to be used.",
        sourceIds: ["readme"]
      },
      {
        id: "f3",
        category: "technical-depth",
        signal: "negative",
        severity: "medium",
        title: "Technical detail is sparse",
        detail: "Few implementation details are visible in the public repo.",
        sourceIds: ["repo"]
      },
      {
        id: "f4",
        category: "differentiation",
        signal: "positive",
        severity: "medium",
        title: "Intent is visible",
        detail: "The project intent appears quickly from the repository metadata.",
        sourceIds: ["repo"]
      }
    ];

    const scores = buildScores(findings);

    expect(scores.overallGrade).not.toMatch(/^A|^B$/);
    expect(isPassingGrade(scores.overallGrade)).toBe(false);
  });
});

