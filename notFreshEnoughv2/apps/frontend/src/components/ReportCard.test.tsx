import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportCard } from "./ReportCard";

describe("ReportCard", () => {
  test("keeps long recommendation copy grammatical without broken truncation", () => {
    const html = renderToStaticMarkup(
      <ReportCard
        grade="C+"
        summary="Superset summary"
        familyHeadline="Family unconvinced."
        auntyQuestions={[
          "Judge-facing clarity: If differentiation is not made explicit, the project can feel less memorable during short evaluation windows. Add a one-paragraph 'What Judges Should Know' section near the top of the README.",
          "Technical robustness: The stack suggests solid technical depth, but the implementation path is not obvious. Add a brief architecture overview so reviewers can verify it quickly.",
          "Demo and onboarding: A live surface exists, which helps move the project out of pure concept territory. Add a live demo link or a 60-second walkthrough at the top of the README."
        ]}
      />
    );

    expect(html).toContain(
      "Judge-facing clarity: differentiation is not explicit, which may make the project less memorable during short evaluation windows."
    );
    expect(html).toContain("Technical robustness: limited implementation vocabulary and technical surface details were found.");
    expect(html).toContain("Demo and onboarding: a live surface exists but lacks step-by-step context for quick evaluation.");
    expect(html).not.toContain("Add a one-paragraph.");
    expect(html).not.toContain("Add a one-paragraph &#x27;What.");
    expect(html).not.toContain("Add a live demo link or a 60-second walkthrough at.");
    expect(html).not.toContain("Add a ");
    expect(html).not.toContain("Place a ");
  });
});
