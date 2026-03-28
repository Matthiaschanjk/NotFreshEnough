import { describe, expect, test } from "@jest/globals";
import { scoreSimilarity } from "./similarity";

const baseRepo = {
  fullName: "acme/input-repo",
  name: "input-repo",
  url: "https://github.com/acme/input-repo",
  description: "AI project judging platform with analytics",
  stars: 120,
  lastCommit: "2026-03-20T00:00:00.000Z",
  license: "MIT",
  topics: ["ai", "analytics", "hackathon"],
  languages: ["TypeScript", "CSS"],
  primaryLanguage: "TypeScript",
  readme: "# Input Repo\nSetup guide and product overview with demo flow.",
  readmeKeywords: ["judging", "analytics"],
  docsQuality: "high" as const,
  demoUrlPresent: true,
  isFork: false
};

describe("scoreSimilarity", () => {
  test("scores closely matching repos higher", async () => {
    const closeMatch = {
      ...baseRepo,
      fullName: "acme/close-match",
      url: "https://github.com/acme/close-match",
      readme: "# Close Match\nProduct overview, setup, usage, demo flow, analytics and judging.",
      stars: 100
    };

    const farMatch = {
      ...baseRepo,
      fullName: "acme/far-match",
      url: "https://github.com/acme/far-match",
      description: "Rust CLI for terminal dotfiles backup",
      topics: ["rust", "cli"],
      languages: ["Rust"],
      primaryLanguage: "Rust",
      readme: "# Far Match\nBackup your dotfiles from the terminal.",
      docsQuality: "low" as const,
      stars: 5
    };

    const closeScore = await scoreSimilarity(baseRepo, closeMatch);
    const farScore = await scoreSimilarity(baseRepo, farMatch);

    expect(closeScore.similarityScore).toBeGreaterThan(farScore.similarityScore);
    expect(closeScore.similarityScore).toBeGreaterThan(0.6);
    expect(farScore.similarityScore).toBeLessThan(0.55);
  });
});
