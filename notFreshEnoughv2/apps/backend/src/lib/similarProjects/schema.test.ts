import { describe, expect, test } from "@jest/globals";
import { SimilarProjectsResponseSchema } from "./schema";

describe("SimilarProjectsResponseSchema", () => {
  test("accepts the frontend contract shape", () => {
    const payload = SimilarProjectsResponseSchema.parse({
      input_repo: {
        full_name: "owner/repo",
        url: "https://github.com/owner/repo",
        languages: ["TypeScript"],
        topics: ["ai", "automation"],
        description: "A judging helper",
        stars: 42
      },
      project_status: "cousins_found",
      message: "Found 1 cousin project across different repositories.",
      results: [
        {
          full_name: "owner/cousin-one",
          url: "https://github.com/owner/cousin-one",
          description: "Cousin project one",
          similarity_score: 0.92,
          primary_language: "TypeScript",
          stars: 64,
          topic_overlap: ["ai"],
          demo_url_present: true,
          docs_quality: "high"
        }
      ]
    });

    expect(payload.results[0]?.similarity_score).toBe(0.92);
    expect(payload.input_repo.full_name).toBe("owner/repo");
  });
});
