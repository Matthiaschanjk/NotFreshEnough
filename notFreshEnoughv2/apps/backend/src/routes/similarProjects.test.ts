import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { isBlacklistedCandidate } from "../lib/similarProjects/service";
import { createJudgeRouter } from "./judge";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function textResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}

describe("POST /api/similar-projects", () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  test("returns top similar public repos in the required JSON shape", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://tinyfish.example.com/search") {
        return jsonResponse({
          results: [
            {
              title: "Spec Kit",
              url: "https://github.com/cousin/alpha",
              description: "A structured AI-agent development framework."
            },
            {
              title: "gStack",
              url: "https://github.com/cousin/bravo",
              description: "An opinionated agent skills toolkit."
            },
            {
              title: "BMAD-METHOD",
              url: "https://github.com/cousin/charlie",
              description: "An AI-driven agile development method."
            },
            {
              title: "Hello World v2",
              url: "https://github.com/octocat/Hello-World-v2",
              description: "A versioned clone that should be filtered."
            }
          ]
        });
      }

      if (url.includes("/repos/octocat/Hello-World/languages")) {
        return jsonResponse({ TypeScript: 1000, HTML: 200 });
      }

      if (url.includes("/repos/octocat/Hello-World/readme")) {
        return textResponse("# Hello World\nAI judging project with setup, usage and demo guide.");
      }

      if (url.includes("/repos/octocat/Hello-World")) {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "hackathon"],
          homepage: "https://hello-world.demo",
          default_branch: "main"
        });
      }

      if (url.includes("/repos/cousin/alpha/languages")) {
        return jsonResponse({ TypeScript: 900, CSS: 100 });
      }

      if (url.includes("/repos/octocat/Hello-World-v2/languages")) {
        return jsonResponse({ TypeScript: 950, HTML: 150 });
      }

      if (url.includes("/repos/cousin/bravo/languages")) {
        return jsonResponse({ JavaScript: 900 });
      }

      if (url.includes("/repos/cousin/charlie/languages")) {
        return jsonResponse({ TypeScript: 500, Python: 200 });
      }

      if (url.includes("/repos/cousin/alpha/readme")) {
        return textResponse("# Alpha\nHackathon judging helper with demo, setup and usage examples.");
      }

      if (url.includes("/repos/octocat/Hello-World-v2/readme")) {
        return textResponse("# Hello World V2\nA versioned successor with nearly identical copy.");
      }

      if (url.includes("/repos/cousin/bravo/readme")) {
        return textResponse("# Bravo\nAnalytics dashboard with some docs.");
      }

      if (url.includes("/repos/cousin/charlie/readme")) {
        return textResponse("# Charlie\nAI evaluation workflow and documentation.");
      }

      if (url.includes("/repos/cousin/alpha")) {
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
          default_branch: "main"
        });
      }

      if (url.includes("/repos/octocat/Hello-World-v2")) {
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

      if (url.includes("/repos/cousin/bravo")) {
        return jsonResponse({
          name: "bravo",
          full_name: "cousin/bravo",
          html_url: "https://github.com/cousin/bravo",
          description: "Somewhat related dashboard",
          stargazers_count: 30,
          pushed_at: "2026-02-01T00:00:00.000Z",
          license: { spdx_id: "Apache-2.0" },
          topics: ["analytics"],
          homepage: "",
          default_branch: "main"
        });
      }

      if (url.includes("/repos/cousin/charlie")) {
        return jsonResponse({
          name: "charlie",
          full_name: "cousin/charlie",
          html_url: "https://github.com/cousin/charlie",
          description: "AI evaluation toolkit",
          stargazers_count: 55,
          pushed_at: "2026-03-14T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai", "evaluation"],
          homepage: "",
          default_branch: "main"
        });
      }

      return new Response("not found", { status: 404 });
    });

    const router = createJudgeRouter({
      BACKEND_PORT: 8787,
      FRONTEND_ORIGIN: "http://localhost:5173",
      GITHUB_TOKEN: undefined,
      BING_SEARCH_KEY: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: "gpt-4.1-mini",
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key",
      TINYFISH_BASE_URL: "https://tinyfish.example.com"
    });

    const routeLayer = router.stack.find((layer) => layer.route?.path === "/similar-projects");
    const handler = routeLayer?.route?.stack[0]?.handle as
      | ((request: { body: { github_url: string } }, response: { status: (code: number) => unknown; json: (value: unknown) => unknown }, next: (error?: unknown) => void) => Promise<void>)
      | undefined;

    expect(handler).toBeDefined();

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

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { input_repo: { full_name: string } }).input_repo.full_name).toBe("octocat/Hello-World");
    expect((body as { results: unknown[] }).results).toHaveLength(3);
    expect((body as { project_status: string }).project_status).toBe("cousins_found");
    expect((body as { results: Array<{ full_name: string }> }).results.map((result) => result.full_name)).not.toContain(
      "octocat/Hello-World-v2"
    );
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/search/repositories"), expect.anything());
    expect((body as { results: unknown[] }).results[0]).toEqual(
      expect.objectContaining({
        full_name: expect.any(String),
        similarity_score: expect.any(Number),
        primary_language: expect.any(String),
        docs_quality: expect.stringMatching(/low|med|high/)
      })
    );
  });

  test("returns original-project status when only the input repo can be found", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://tinyfish.example.com/search") {
        return jsonResponse({
          results: [
            {
              title: "Hello World",
              url: "https://github.com/octocat/Hello-World",
              description: "Input repository only."
            }
          ]
        });
      }

      if (url.includes("/search/repositories")) {
        return jsonResponse({ items: [] });
      }

      if (url.includes("/repos/octocat/Hello-World/languages")) {
        return jsonResponse({ TypeScript: 1000 });
      }

      if (url.includes("/repos/octocat/Hello-World/readme")) {
        return textResponse("# Hello World\nInput readme.");
      }

      if (url.includes("/repos/octocat/Hello-World")) {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai"],
          homepage: "",
          default_branch: "main"
        });
      }

      return new Response("not found", { status: 404 });
    });

    const router = createJudgeRouter({
      BACKEND_PORT: 8787,
      FRONTEND_ORIGIN: "http://localhost:5173",
      GITHUB_TOKEN: undefined,
      BING_SEARCH_KEY: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: "gpt-4.1-mini",
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key",
      TINYFISH_BASE_URL: "https://tinyfish.example.com"
    });

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

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { results: unknown[] }).results).toHaveLength(0);
    expect((body as { project_status: string }).project_status).toBe("original_project");
    expect((body as { message: string }).message).toMatch(/original idea/i);
  });

  test("returns original-project fallback when input github lookup fails", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/repos/octocat/Hello-World")) {
        return new Response("boom", { status: 500 });
      }

      return new Response("not found", { status: 404 });
    });

    const router = createJudgeRouter({
      BACKEND_PORT: 8787,
      FRONTEND_ORIGIN: "http://localhost:5173",
      GITHUB_TOKEN: undefined,
      BING_SEARCH_KEY: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: "gpt-4.1-mini",
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key",
      TINYFISH_BASE_URL: "https://tinyfish.example.com"
    });

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

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { input_repo: { full_name: string } }).input_repo.full_name).toBe("octocat/Hello-World");
    expect((body as { results: unknown[] }).results).toHaveLength(0);
    expect((body as { project_status: string }).project_status).toBe("original_project");
    expect((body as { message: string }).message).toMatch(/original idea/i);
  });

  test("returns original-project status when GitHub repo search responds with 422", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://tinyfish.example.com/search") {
        return new Response("tinyfish unavailable", { status: 503 });
      }

      if (url.includes("/repos/octocat/Hello-World/languages")) {
        return jsonResponse({ TypeScript: 1000 });
      }

      if (url.includes("/repos/octocat/Hello-World/readme")) {
        return textResponse("# Hello World\nInput readme.");
      }

      if (url.includes("/repos/octocat/Hello-World")) {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai"],
          homepage: "",
          default_branch: "main"
        });
      }

      if (url.includes("/search/repositories")) {
        return new Response("unprocessable", { status: 422 });
      }

      return new Response("not found", { status: 404 });
    });

    const router = createJudgeRouter({
      BACKEND_PORT: 8787,
      FRONTEND_ORIGIN: "http://localhost:5173",
      GITHUB_TOKEN: undefined,
      BING_SEARCH_KEY: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: "gpt-4.1-mini",
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key",
      TINYFISH_BASE_URL: "https://tinyfish.example.com"
    });

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

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { project_status: string }).project_status).toBe("original_project");
    expect((body as { results: unknown[] }).results).toHaveLength(0);
    expect((body as { message: string }).message).toMatch(/original idea/i);
  });

  test("returns original-project status when cousin repo hydration fails", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://tinyfish.example.com/search") {
        return jsonResponse({
          results: [
            {
              title: "Broken cousin",
              url: "https://github.com/cousin/broken",
              description: "Hydration should fail."
            }
          ]
        });
      }

      if (url.includes("/search/repositories")) {
        return jsonResponse({ items: [] });
      }

      if (url.includes("/repos/octocat/Hello-World/languages")) {
        return jsonResponse({ TypeScript: 1000 });
      }

      if (url.includes("/repos/octocat/Hello-World/readme")) {
        return textResponse("# Hello World\nInput readme.");
      }

      if (url.includes("/repos/octocat/Hello-World")) {
        return jsonResponse({
          name: "Hello-World",
          full_name: "octocat/Hello-World",
          html_url: "https://github.com/octocat/Hello-World",
          description: "AI judging repo",
          stargazers_count: 99,
          pushed_at: "2026-03-20T00:00:00.000Z",
          license: { spdx_id: "MIT" },
          topics: ["ai"],
          homepage: "",
          default_branch: "main"
        });
      }

      if (url.includes("/repos/cousin/broken")) {
        return new Response("boom", { status: 500 });
      }

      return new Response("not found", { status: 404 });
    });

    const router = createJudgeRouter({
      BACKEND_PORT: 8787,
      FRONTEND_ORIGIN: "http://localhost:5173",
      GITHUB_TOKEN: undefined,
      BING_SEARCH_KEY: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_MODEL: "gpt-4.1-mini",
      TINYFISH_MODE: "sdk",
      TINYFISH_API_KEY: "tinyfish-key",
      TINYFISH_BASE_URL: "https://tinyfish.example.com"
    });

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

    expect(nextError).toBeNull();
    expect(statusCode).toBe(200);
    expect((body as { results: unknown[] }).results).toHaveLength(0);
    expect((body as { project_status: string }).project_status).toBe("original_project");
    expect((body as { message: string }).message).toMatch(/original idea/i);
  });

  test("blacklists the input repo and exact forks or versioned clones", () => {
    const inputRepo = {
      fullName: "octocat/Hello-World",
      name: "Hello-World",
      url: "https://github.com/octocat/Hello-World",
      description: "Input repo",
      stars: 10,
      lastCommit: "2026-03-20T00:00:00.000Z",
      license: "MIT",
      topics: ["ai"],
      languages: ["TypeScript"],
      primaryLanguage: "TypeScript",
      readme: "",
      readmeKeywords: [],
      docsQuality: "med" as const,
      demoUrlPresent: false,
      isFork: false
    };

    expect(isBlacklistedCandidate(inputRepo, { ...inputRepo })).toBe(true);
    expect(isBlacklistedCandidate(inputRepo, { ...inputRepo, fullName: "octocat/Hello-World-v2", name: "Hello-World-v2" })).toBe(true);
    expect(isBlacklistedCandidate(inputRepo, { ...inputRepo, fullName: "someone/Hello-World-v2", name: "Hello-World-v2" })).toBe(false);
    expect(
      isBlacklistedCandidate(inputRepo, {
        ...inputRepo,
        fullName: "someone/forked-hello",
        name: "forked-hello",
        isFork: true,
        parentFullName: "octocat/Hello-World"
      })
    ).toBe(true);
  });
});
