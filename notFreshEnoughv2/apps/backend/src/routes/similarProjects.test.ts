import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { buildTinyFishRunGoal } from "../lib/tinyfishAdapter";
import { createJudgeRouter } from "./judge";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}

function createEnv(mode: "mock" | "sdk" | "api" = "sdk") {
  return {
    BACKEND_PORT: 8787,
    FRONTEND_ORIGIN: "http://localhost:5173",
    GITHUB_TOKEN: undefined,
    BING_SEARCH_KEY: "bing-key",
    OPENAI_API_KEY: undefined,
    OPENAI_BASE_URL: undefined,
    OPENAI_MODEL: "gpt-4.1-mini",
    TINYFISH_MODE: mode,
    TINYFISH_API_KEY: "tinyfish-key",
    TINYFISH_BASE_URL: "https://agent.tinyfish.ai/v1"
  } as const;
}

async function invokeSimilarProjectsRoute(router = createJudgeRouter(createEnv())) {
  const routeLayer = router.stack.find((layer) => layer.route?.path === "/similar-projects");
  const handler = routeLayer?.route?.stack[0]?.handle as
    | ((request: { body: { github_url: string } }, response: { status: (code: number) => unknown; json: (value: unknown) => unknown }, next: (error?: unknown) => void) => Promise<void>)
    | undefined;

  let statusCode = 200;
  let body: unknown = null;
  let nextError: unknown = null;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    }
  };

  await handler?.(
    {
      body: {
        github_url: "https://github.com/octocat/Hello-World"
      }
    },
    response,
    (error?: unknown) => {
      nextError = error;
    }
  );

  return { statusCode, body, nextError };
}

describe("POST /api/similar-projects", () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  test("uses TinyFish as the primary discovery layer and filters the input repo and versioned clones", async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) as { goal?: string; url?: string } : null;

      if (url === "https://api.github.com/repos/octocat/Hello-World") {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon", "judging"],
          homepage: "https://hello-world.demo",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/languages") {
        return jsonResponse({ TypeScript: 1000, HTML: 100 });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/readme") {
        return textResponse(
          "# Hello World\nAI judging repo with setup, usage, workflow, architecture, and judges should know notes."
        );
      }

      if (url === "https://agent.tinyfish.ai/v1/automation/run") {
        if (body?.goal?.includes("search for the top 3 public projects")) {
          return jsonResponse({
            result: {
              results: [
                {
                  title: "Hello World",
                  url: "https://github.com/octocat/Hello-World",
                  snippet: "The original repository should be filtered.",
                  source: "github"
                },
                {
                  title: "Hello World v2",
                  url: "https://github.com/octocat/Hello-World-v2",
                  snippet: "Versioned clone that should be blacklisted.",
                  source: "github"
                },
                {
                  title: "Spec Kit",
                  url: "https://github.com/cousin/alpha",
                  snippet: "Structured AI-agent development framework with README and workflow overlap.",
                  source: "github"
                },
                {
                  title: "LaunchPad AI",
                  url: "https://devpost.com/software/launchpad-ai",
                  snippet: "Devpost project for AI judging with public demo and documentation signals.",
                  source: "devpost"
                },
                {
                  title: "AI Builder Showcase",
                  url: "https://www.linkedin.com/posts/public-ai-builder-showcase",
                  snippet: "Public LinkedIn post describing an AI hackathon repo review workflow.",
                  source: "linkedin"
                }
              ]
            }
          });
        }

        if (body?.url === "https://devpost.com/software/launchpad-ai") {
          return jsonResponse({
            result: {
              snippet: "Devpost project with linked GitHub repo and demo.",
              workflow: "Review repo evidence and publish judge-facing notes.",
              technologies: ["TypeScript", "Python"],
              github_urls: ["https://github.com/launchpad/ai-judge"],
              headings: ["Overview", "Demo", "Source code"]
            }
          });
        }

        if (body?.url === "https://www.linkedin.com/posts/public-ai-builder-showcase") {
          return jsonResponse({
            result: {
              snippet: "Public LinkedIn post summarizing an AI hackathon workflow.",
              workflow: "Public listing describes a showcase flow.",
              technologies: ["Python"],
              github_urls: [],
              headings: ["Showcase"]
            }
          });
        }

        return jsonResponse({ result: { results: [] } });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World-v2") {
        return jsonResponse({
          name: "Hello-World-v2",
          full_name: "octocat/Hello-World-v2",
          html_url: "https://github.com/octocat/Hello-World-v2",
          description: "Versioned clone",
          stargazers_count: 140,
          pushed_at: "2026-03-22T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon"],
          homepage: "",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World-v2/languages") {
        return jsonResponse({ TypeScript: 900 });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World-v2/readme") {
        return textResponse("# Hello World v2\nVersioned clone readme.");
      }

      if (url === "https://api.github.com/repos/cousin/alpha") {
        return jsonResponse({
          name: "alpha",
          full_name: "cousin/alpha",
          html_url: "https://github.com/cousin/alpha",
          description: "Very similar judging helper",
          stargazers_count: 120,
          pushed_at: "2026-03-19T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon", "judging"],
          homepage: "https://alpha.demo",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/cousin/alpha/languages") {
        return jsonResponse({ TypeScript: 900, CSS: 100 });
      }

      if (url === "https://api.github.com/repos/cousin/alpha/readme") {
        return textResponse(
          "# Alpha\nHackathon judging helper with setup, usage, examples, demo, and workflow details for judges."
        );
      }

      if (url === "https://api.github.com/repos/launchpad/ai-judge") {
        return jsonResponse({
          name: "ai-judge",
          full_name: "launchpad/ai-judge",
          html_url: "https://github.com/launchpad/ai-judge",
          description: "Devpost-linked AI judging workflow with a public repo and demo.",
          stargazers_count: 84,
          pushed_at: "2026-03-18T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon", "judging"],
          homepage: "https://launchpad-ai.demo",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/launchpad/ai-judge/languages") {
        return jsonResponse({ TypeScript: 850, Python: 120 });
      }

      if (url === "https://api.github.com/repos/launchpad/ai-judge/readme") {
        return textResponse("# LaunchPad AI\nJudge-facing workflow with public demo, setup, and evidence review pipeline.");
      }

      return new Response("not found", { status: 404 });
    });

    const { statusCode, body, nextError } = await invokeSimilarProjectsRoute();

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { input_repo: { full_name: string } }).input_repo.full_name).toBe("octocat/Hello-World");
    expect((body as { results: unknown[] }).results.length).toBeLessThanOrEqual(3);
    expect((body as { results: Array<{ full_name?: string }> }).results.map((result) => result.full_name)).not.toContain(
      "octocat/Hello-World"
    );
    expect((body as { results: Array<{ full_name?: string }> }).results.map((result) => result.full_name)).not.toContain(
      "octocat/Hello-World-v2"
    );
    expect((body as { results: Array<{ source: string }> }).results.every((result) => typeof result.source === "string")).toBe(true);
    expect(typeof (body as { results: Array<{ similarity_score: number }> }).results[0]?.similarity_score).toBe("number");
    expect(
      (body as { results: Array<{ source: string; full_name?: string; primary_language: string }> }).results.some(
        (result) =>
          result.source === "devpost" &&
          result.full_name === "launchpad/ai-judge" &&
          result.primary_language === "TypeScript"
      )
    ).toBe(true);
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/search/repositories"), expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://agent.tinyfish.ai/v1/automation/run",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String)
      })
    );
    const tinyFishCall = fetchMock.mock.calls.find(([url]) => url === "https://agent.tinyfish.ai/v1/automation/run");
    const tinyFishBody = JSON.parse(String(tinyFishCall?.[1] && (tinyFishCall[1] as RequestInit).body)) as {
      url: string;
      goal: string;
      browser_profile: string;
      options: {
        sources: string[];
        max_results: number;
        respect_robots: boolean;
        rate_limit_per_host: number;
        user_agent: string;
        blacklist: string[];
      };
    };
    expect(tinyFishBody.goal).toBe(
      buildTinyFishRunGoal("https://github.com/octocat/Hello-World")
    );
    expect(tinyFishBody.url).toBe("https://github.com/octocat/Hello-World");
    expect(tinyFishBody.goal).toContain("search for the top 3 public projects that are similar in purpose");
    expect(tinyFishBody.goal.startsWith("Navigate to ")).toBe(false);
    expect(tinyFishBody.browser_profile).toBe("stealth");
    expect(tinyFishBody.options).toEqual(
      expect.objectContaining({
        sources: ["github", "devpost", "linkedin"],
        max_results: 50,
        respect_robots: true,
        rate_limit_per_host: 2,
        user_agent: "NotFreshEnough/1.0",
        blacklist: expect.arrayContaining(["octocat/hello-world"])
      })
    );
  });

  test("triggers fallback discovery when TinyFish returns no usable candidates", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/repos/octocat/Hello-World") {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon"],
          homepage: "",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/languages") {
        return jsonResponse({ TypeScript: 1000 });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/readme") {
        return textResponse("# Hello World\nRepo readme with setup and usage.");
      }

      if (url === "https://agent.tinyfish.ai/v1/automation/run") {
        return jsonResponse({ result: { results: [] } });
      }

      if (url.includes("/search/repositories")) {
        return jsonResponse({
          items: [
            {
              full_name: "cousin/bravo",
              html_url: "https://github.com/cousin/bravo",
              owner: { login: "cousin" },
              name: "bravo"
            }
          ]
        });
      }

      if (url === "https://api.github.com/repos/cousin/bravo") {
        return jsonResponse({
          name: "bravo",
          full_name: "cousin/bravo",
          html_url: "https://github.com/cousin/bravo",
          description: "Fallback GitHub cousin",
          stargazers_count: 42,
          pushed_at: "2026-03-10T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai"],
          homepage: "",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/cousin/bravo/languages") {
        return jsonResponse({ TypeScript: 800 });
      }

      if (url === "https://api.github.com/repos/cousin/bravo/readme") {
        return textResponse("# Bravo\nFallback repo with docs and examples.");
      }

      if (url.startsWith("https://api.bing.microsoft.com/v7.0/search")) {
        return jsonResponse({ webPages: { value: [] } });
      }

      return new Response("not found", { status: 404 });
    });

    const { body, nextError } = await invokeSimilarProjectsRoute();

    expect(nextError).toBeNull();
    expect((body as { results: Array<{ source: string }> }).results[0]?.source).toBe("github");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/search/repositories"), expect.anything());
  });

  test("supports mock mode fixture playback for cross-site hits", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/repos/octocat/Hello-World") {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon"],
          homepage: "",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/languages") {
        return jsonResponse({ TypeScript: 1000 });
      }

      if (url === "https://api.github.com/repos/octocat/Hello-World/readme") {
        return textResponse("# Hello World\nRepo readme with setup, usage, and architecture.");
      }

      if (url === "https://api.github.com/repos/cousin/alpha") {
        return jsonResponse({
          name: "alpha",
          full_name: "cousin/alpha",
          html_url: "https://github.com/cousin/alpha",
          description: "Fixture GitHub cousin",
          stargazers_count: 64,
          pushed_at: "2026-03-18T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "workflow"],
          homepage: "https://alpha.demo",
          default_branch: "main",
          fork: false
        });
      }

      if (url === "https://api.github.com/repos/cousin/alpha/languages") {
        return jsonResponse({ TypeScript: 700 });
      }

      if (url === "https://api.github.com/repos/cousin/alpha/readme") {
        return textResponse("# Alpha\nFixture cousin readme with examples and demo.");
      }

      return new Response("not found", { status: 404 });
    });

    const { body, nextError } = await invokeSimilarProjectsRoute(createJudgeRouter(createEnv("mock")));

    expect(nextError).toBeNull();
    expect((body as { results: Array<{ source: string }> }).results.length).toBeGreaterThan(0);
    expect((body as { results: Array<{ source: string }> }).results.some((result) => result.source === "devpost")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalledWith("https://agent.tinyfish.ai/v1/search", expect.anything());
    expect(fetchMock).not.toHaveBeenCalledWith("https://agent.tinyfish.ai/v1/automation/run", expect.anything());
  });
});
