import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { YourCousinsProjects } from "./YourCousinsProjects";
import { buildComparisonRows } from "../lib/similarProjects/comparison";
import type { SimilarProjectsResponse } from "../types/similarProjects";

const completeFixture: SimilarProjectsResponse = {
  input_repo: {
    full_name: "acme/project",
    url: "https://github.com/acme/project",
    languages: ["TypeScript", "Python"],
    topics: ["workflow", "automation", "evaluation"],
    description: "An automation project that evaluates repository quality and evidence for technical teams.",
    stars: 48
  },
  results: [
    {
      full_name: "cousin/alpha",
      url: "https://github.com/cousin/alpha",
      source: "github",
      one_line_description: "A repository review tool that compares project execution quality and technical evidence for developers.",
      similarity_score: 0.87,
      primary_language: "TypeScript",
      stars: 72,
      topic_overlap: ["workflow", "automation"],
      demo_url_present: true,
      docs_quality: "high"
    }
  ],
  project_status: "cousins_found",
  message: "Found 1 similar public project across TinyFish discovery sources."
};

const sparseFixture: SimilarProjectsResponse = {
  input_repo: {
    full_name: "acme/minimal",
    url: "https://github.com/acme/minimal",
    languages: [],
    topics: [],
    description: "",
    stars: 0
  },
  results: [
    {
      url: "https://www.linkedin.com/posts/example",
      source: "linkedin",
      one_line_description: "",
      similarity_score: 0.32,
      primary_language: "",
      topic_overlap: [],
      demo_url_present: false,
      docs_quality: "low"
    }
  ],
  project_status: "cousins_found",
  message: "Found 1 similar public project across TinyFish discovery sources."
};

describe("YourCousinsProjects", () => {
  test("renders single-phrase labels and merged core differences and overall rows", () => {
    const html = renderToStaticMarkup(
      <YourCousinsProjects data={completeFixture} isLoading={false} errorMessage={null} />
    );
    const rows = buildComparisonRows(completeFixture.input_repo, completeFixture.results[0]!);

    const labels = [
      "Use case",
      "Workflow",
      "Tech stack",
      "Core differences",
      "Overall similarity level"
    ];

    for (const label of labels) {
      expect(html).toContain(label);
    }

    expect(html).not.toContain("Target user");
    expect(html).not.toContain("Problem / use case");
    expect(html).not.toContain("Workflow / pipeline");
    expect(html).not.toContain("Tech stack / implementation");
    expect(rows.every((row) => !row.feature.includes("/"))).toBe(true);
    expect(html).toContain('colSpan="3"');
    expect(html).toContain('class="assessment assessment-cell core-differences');
    expect(rows.filter((row) => row.merged).map((row) => row.feature)).toEqual(["Core differences", "Overall similarity level"]);
  });

  test("uses approved missing-evidence phrases and avoids prefatory phrasing in table cells", () => {
    const sparseRows = buildComparisonRows(sparseFixture.input_repo, sparseFixture.results[0]!);
    const sparseJoined = sparseRows
      .flatMap((row) => [row.inputRepo ?? "", row.cousinRepo ?? "", row.assessment ?? ""])
      .join(" ");

    expect(
      [
        "Not clearly documented in the public repo",
        "Insufficient public evidence from README/docs",
        "Implementation details not exposed in public materials"
      ].some((phrase) => sparseJoined.includes(phrase))
    ).toBe(true);

    const completeRows = buildComparisonRows(completeFixture.input_repo, completeFixture.results[0]!);
    const completeJoined = completeRows
      .flatMap((row) => [row.inputRepo ?? "", row.cousinRepo ?? "", row.assessment ?? ""])
      .join(" ");

    expect(completeJoined).not.toContain("The cousin is presented as");
    expect(completeJoined).not.toContain("It shares");
    expect(completeJoined).not.toContain("This repository is");
  });

  test("keeps table text emoji-free and snapshots a representative table", () => {
    const html = renderToStaticMarkup(
      <YourCousinsProjects data={completeFixture} isLoading={false} errorMessage={null} />
    );
    const tableMarkup = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
    const rows = buildComparisonRows(completeFixture.input_repo, completeFixture.results[0]!);
    const workflowRow = rows.find((row) => row.feature === "Workflow");
    const overallRow = rows.find((row) => row.feature === "Overall similarity level");

    expect(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/u.test(tableMarkup)).toBe(false);
    expect((workflowRow?.inputRepo ?? "").length).toBeLessThanOrEqual(140);
    expect((workflowRow?.cousinRepo ?? "").length).toBeLessThanOrEqual(140);
    expect(workflowRow?.inputRepo).toContain("Outputs:");
    expect(workflowRow?.cousinRepo).toContain("Outputs:");
    expect(workflowRow?.inputRepo).toMatch(/\((Based on|Inferred from): /);
    expect(workflowRow?.cousinRepo).toMatch(/\((Based on|Inferred from): /);
    expect(overallRow?.mergedAssessment).toMatch(/^(Low|Moderate|High|Inconclusive) —/);
    expect(tableMarkup).toMatchSnapshot();
  });
});
