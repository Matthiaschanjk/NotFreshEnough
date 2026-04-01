import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { Env } from "../../config/env";
import { createTinyFishClient, investigateProject } from "./investigateProject";
import { MockTinyFishClient } from "./mockTinyFishClient";
import { RealTinyFishClient } from "./realTinyFishClient";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

const baseEnv: Env = {
  BACKEND_PORT: 8787,
  FRONTEND_ORIGIN: "http://localhost:5173",
  GITHUB_TOKEN: undefined,
  BING_SEARCH_KEY: undefined,
  OPENAI_API_KEY: undefined,
  OPENAI_BASE_URL: undefined,
  OPENAI_MODEL: "gpt-4.1-mini",
  TINYFISH_MODE: "mock",
  TINYFISH_API_KEY: undefined,
  TINYFISH_BASE_URL: "https://agent.tinyfish.ai/v1"
};

describe("TinyFish client selection", () => {
  test("uses the mock client when TINYFISH_MODE=mock", () => {
    const client = createTinyFishClient(baseEnv);
    expect(client).toBeInstanceOf(MockTinyFishClient);
  });

  test("uses the real client when TINYFISH_MODE=sdk", () => {
    const client = createTinyFishClient({
      ...baseEnv,
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key"
    });

    expect(client).toBeInstanceOf(RealTinyFishClient);
  });
});

describe("TinyFish sdk investigation", () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  test("inspects the repo and demo through TinyFish when sdk mode is enabled", async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.github.com/repos/octocat/Hello-World") {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          description: "AI judging repo",
          homepage: "https://hello-world.demo",
          default_branch: "main",
          stargazers_count: 99,
          open_issues_count: 3,
          pushed_at: "2026-03-20T00:00:00.000Z",
          updated_at: "2026-03-21T00:00:00.000Z",
          topics: ["ai", "hackathon", "judging"],
          html_url: "https://github.com/octocat/Hello-World"
        });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/languages") {
        return jsonResponse({ TypeScript: 1000, HTML: 200 });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/readme") {
        return jsonResponse({
          content: Buffer.from(
            [
              "# Hello World",
              "",
              "Hello World is a hackathon judging helper that explains setup, usage, architecture, and why judges should care.",
              "",
              "## Setup",
              "Run npm install and npm run dev.",
              "",
              "## Usage",
              "Open the app, submit a repo, and inspect the report.",
              "",
              "## For Judges",
              "Look for proof of a working demo, clear value, and implementation depth."
            ].join("\n")
          ).toString("base64"),
          html_url: "https://github.com/octocat/Hello-World/blob/main/README.md",
          download_url: "https://raw.githubusercontent.com/octocat/Hello-World/main/README.md"
        });
      }

      if (url === "https://agent.tinyfish.ai/v1/automation/run") {
        const body = JSON.parse(String((init as RequestInit | undefined)?.body ?? "{}")) as { url?: string };

        if (body.url === "https://github.com/octocat/Hello-World") {
          return jsonResponse({
            result: {
              title: "octocat/Hello-World",
              content:
                "GitHub repository for Hello World. Contains the source code, README, setup instructions, and links to the live demo.",
              headings: ["About", "README", "Recent activity"]
            }
          });
        }

        return jsonResponse({
          result: {
            title: "Hello World Demo",
            content:
              "Hello World is live. Judges can upload a repository, inspect a detailed scorecard, and review implementation notes with screenshots and concrete proof.",
            headings: ["Hero", "Features", "Scorecard"]
          }
        });
      }

      return new Response("not found", { status: 404 });
    });

    const result = await investigateProject(
      {
        repoUrl: "https://github.com/octocat/Hello-World"
      },
      {
        ...baseEnv,
        TINYFISH_MODE: "sdk",
        TINYFISH_API_KEY: "tinyfish-key"
      }
    );

    expect(result.metadata.investigationMode).toBe("sdk");
    expect(result.surfaces.find((surface) => surface.surfaceType === "repo")?.notes).toContain("README");
    expect(result.surfaces.some((surface) => surface.surfaceType === "demo" && surface.status === "ok")).toBe(true);
    const tinyFishCalls = fetchMock.mock.calls.filter(([url]) => url === "https://agent.tinyfish.ai/v1/automation/run");
    expect(tinyFishCalls).toHaveLength(2);
    expect(tinyFishCalls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-API-Key": "tinyfish-key"
        }),
        body: expect.stringContaining("https://github.com/octocat/Hello-World")
      })
    );
  });
});
