import type { JudgeProjectInput } from "../schemas/input";
import {
  TinyFishInvestigationResultSchema,
  type CandidateArtifact,
  type Severity,
  type TinyFishFinding,
  type TinyFishInvestigationResult,
  type TinyFishSurface
} from "../schemas/tinyfish";
import { HttpError } from "../utils/httpError";
import { createId } from "../utils/ids";
import { parseGitHubRepoUrl } from "../utils/github";
import { fetchGitHubLanguages, fetchGitHubReadme, fetchGitHubRepo } from "./fetchers/github";
import { fetchWebSurface, type FetchedWebSurface } from "./fetchers/web";
import type { TinyFishClient } from "./client";

type FindingSignal = TinyFishFinding["signal"];

const README_SECTION_RULES = [
  {
    title: "Setup instructions are not obvious",
    detail: "README does not clearly explain how a judge can install or run the project.",
    regex: /^#+\s*(installation|getting started|setup|run locally|how to run)/im
  },
  {
    title: "Usage flow is under-explained",
    detail: "README does not clearly show how the product is supposed to be used.",
    regex: /^#+\s*(usage|how it works|workflow|demo flow|features)/im
  },
  {
    title: "Judge-facing context is missing",
    detail: "There is no section that helps judges quickly understand why this project matters and what to look for.",
    regex: /^#+\s*(for judges|judges should know|why this matters|overview)/im
  }
] as const;

const TECHNICAL_DEPTH_MARKERS = /\b(api|architecture|agent|pipeline|worker|orchestrator|inference|vector|cache|queue|evaluation|model)\b/i;

function clip(value: string | undefined, length = 240) {
  if (!value) {
    return undefined;
  }

  const squashed = value.replace(/\s+/g, " ").trim();
  return squashed.length > length ? `${squashed.slice(0, length - 1)}…` : squashed;
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstParagraph(markdown: string) {
  const cleaned = markdown
    .split(/\n\s*\n/)
    .map((chunk) => stripMarkdown(chunk))
    .find((chunk) => chunk && chunk.length > 70 && /[a-z]/i.test(chunk));

  return clip(cleaned, 360);
}

function daysSince(dateString?: string) {
  if (!dateString) {
    return null;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const delta = Date.now() - parsed.getTime();
  return Math.floor(delta / (1000 * 60 * 60 * 24));
}

function scoreImpact(signal: FindingSignal, severity: Severity) {
  const weight = severity === "high" ? 9 : severity === "medium" ? 6 : 4;
  return signal === "negative" ? weight : Math.max(3, weight - 1);
}

function includesWord(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export class MockTinyFishClient implements TinyFishClient {
  async investigateProject(input: JudgeProjectInput): Promise<TinyFishInvestigationResult> {
    const repoRef = parseGitHubRepoUrl(input.repoUrl);
    if (!repoRef) {
      throw new HttpError(400, "Please submit a valid public GitHub repository URL.");
    }

    const partialFailures: string[] = [];
    const warnings: string[] = [];

    const repoData = await fetchGitHubRepo(repoRef.owner, repoRef.repo);
    const languages = await fetchGitHubLanguages(repoRef.owner, repoRef.repo).catch(() => []);
    const readme = await fetchGitHubReadme(repoRef.owner, repoRef.repo).catch((error: Error) => {
      partialFailures.push(`README inspection failed: ${error.message}`);
      return null;
    });

    const surfaces: TinyFishSurface[] = [];
    const findings: TinyFishFinding[] = [];

    const pushSurface = (surface: Omit<TinyFishSurface, "id">) => {
      const withId = {
        id: createId("surface"),
        ...surface
      };
      surfaces.push(withId);
      return withId;
    };

    const addFinding = (finding: Omit<TinyFishFinding, "id">) => {
      findings.push({
        id: createId("finding"),
        ...finding
      });
    };

    const repoSurface = pushSurface({
      surfaceType: "repo",
      label: "GitHub repository",
      url: repoData.html_url,
      status: "ok",
      title: repoData.full_name,
      textContent: clip(
        [
          repoData.description ?? "",
          repoData.topics?.length ? `Topics: ${repoData.topics.join(", ")}` : "",
          languages.length ? `Languages: ${languages.join(", ")}` : ""
        ]
          .filter(Boolean)
          .join(" | "),
        500
      ),
      snippet: clip(repoData.description ?? "", 200),
      notes: []
    });

    const readmeText = readme?.content ? stripMarkdown(readme.content) : "";
    const readmeSurface = readme
      ? pushSurface({
          surfaceType: "readme",
          label: "README",
          url: readme.htmlUrl,
          status: "ok",
          title: "README",
          textContent: clip(readmeText, 3200),
          snippet: firstParagraph(readme.content),
          notes: []
        })
      : pushSurface({
          surfaceType: "readme",
          label: "README",
          status: "failed",
          title: "README not found",
          notes: ["No README was returned by GitHub."]
        });

    const demoUrl = input.demoUrl ?? repoData.homepage ?? undefined;
    const demoSurface = await this.inspectOptionalSurface("demo", "Demo", demoUrl, partialFailures, pushSurface);
    const submissionSurface = await this.inspectOptionalSurface(
      "submission",
      "Submission page",
      input.submissionUrl,
      partialFailures,
      pushSurface
    );

    const blurbSurface =
      input.projectBlurb &&
      pushSurface({
        surfaceType: "project-blurb",
        label: "Project blurb",
        status: "ok",
        title: "Submission blurb",
        textContent: clip(input.projectBlurb, 1200),
        snippet: clip(input.projectBlurb, 220),
        notes: []
      });

    if (!repoData.description && !input.projectBlurb) {
      addFinding({
        category: "clarity",
        signal: "negative",
        severity: "high",
        title: "Core project pitch is hard to find",
        detail: "Neither the repository metadata nor the optional blurb immediately explains what the project does.",
        sourceIds: [repoSurface.id]
      });
    } else {
      addFinding({
        category: "clarity",
        signal: "positive",
        severity: "medium",
        title: "Project intent appears quickly",
        detail: "The repository metadata gives judges an immediate first-pass understanding of the project.",
        sourceIds: [repoSurface.id],
        evidenceSnippet: clip(repoData.description ?? input.projectBlurb)
      });
    }

    if (!readme || readmeText.length < 380) {
      addFinding({
        category: "completeness",
        signal: "negative",
        severity: "high",
        title: "README is too thin for judging",
        detail: "TinyFish could not find enough README detail to explain setup, functionality, and implementation choices.",
        sourceIds: [readmeSurface.id],
        evidenceSnippet: readmeSurface.snippet
      });
    } else {
      addFinding({
        category: "completeness",
        signal: "positive",
        severity: "medium",
        title: "README has enough material to inspect",
        detail: "There is enough README substance for judges to inspect product intent and implementation shape.",
        sourceIds: [readmeSurface.id],
        evidenceSnippet: readmeSurface.snippet
      });
    }

    for (const sectionRule of README_SECTION_RULES) {
      if (!readmeText || !sectionRule.regex.test(readme?.content ?? "")) {
        addFinding({
          category: sectionRule.title.includes("Judge") ? "proof" : "completeness",
          signal: "negative",
          severity: sectionRule.title.includes("Judge") ? "high" : "medium",
          title: sectionRule.title,
          detail: sectionRule.detail,
          sourceIds: [readmeSurface.id]
        });
      }
    }

    if (!demoSurface) {
      addFinding({
        category: "proof",
        signal: "negative",
        severity: "high",
        title: "Live proof is missing",
        detail: "TinyFish could not inspect a working demo surface, which makes judge confidence much lower.",
        sourceIds: [repoSurface.id]
      });
    } else if (demoSurface.status !== "ok" || !demoSurface.textContent || demoSurface.textContent.length < 180) {
      addFinding({
        category: "proof",
        signal: "negative",
        severity: "medium",
        title: "Demo exists, but it does not explain much",
        detail: "The inspected demo surface is very thin, so it does not do enough work to prove the product value.",
        sourceIds: [demoSurface.id],
        evidenceSnippet: demoSurface.snippet
      });
    } else {
      addFinding({
        category: "proof",
        signal: "positive",
        severity: "medium",
        title: "Demo gives judges something concrete",
        detail: "A live surface exists, which helps move the project out of pure concept territory.",
        sourceIds: [demoSurface.id],
        evidenceSnippet: demoSurface.snippet
      });
    }

    if (submissionSurface?.status === "ok") {
      addFinding({
        category: "consistency",
        signal: "positive",
        severity: "low",
        title: "Submission trail is inspectable",
        detail: "TinyFish can follow a public submission surface in addition to the repo.",
        sourceIds: [submissionSurface.id]
      });
    }

    const pushedDaysAgo = daysSince(repoData.pushed_at ?? undefined);
    if (pushedDaysAgo === null) {
      warnings.push("GitHub did not return a pushed_at timestamp.");
    } else if (pushedDaysAgo > 120) {
      addFinding({
        category: "freshness",
        signal: "negative",
        severity: "high",
        title: "Recent repo activity looks stale",
        detail: `The repository appears not to have been pushed to in about ${pushedDaysAgo} days.`,
        sourceIds: [repoSurface.id]
      });
    } else if (pushedDaysAgo > 45) {
      addFinding({
        category: "freshness",
        signal: "negative",
        severity: "medium",
        title: "Project movement feels a bit stale",
        detail: `The latest visible repository push was about ${pushedDaysAgo} days ago.`,
        sourceIds: [repoSurface.id]
      });
    } else {
      addFinding({
        category: "freshness",
        signal: "positive",
        severity: "medium",
        title: "Recent activity supports freshness",
        detail: `The repository shows visible push activity within roughly the last ${pushedDaysAgo} days.`,
        sourceIds: [repoSurface.id]
      });
    }

    if (repoData.topics.length >= 3) {
      addFinding({
        category: "differentiation",
        signal: "positive",
        severity: "low",
        title: "Project themes are tagged",
        detail: "Repository topics help judges understand positioning quickly.",
        sourceIds: [repoSurface.id],
        evidenceSnippet: repoData.topics.join(", ")
      });
    } else {
      addFinding({
        category: "differentiation",
        signal: "negative",
        severity: "medium",
        title: "Differentiation signals are weak",
        detail: "TinyFish did not find strong positioning signals like clear topics, crisp framing, or a strong differentiator.",
        sourceIds: [repoSurface.id, ...(blurbSurface ? [blurbSurface.id] : [])],
        evidenceSnippet: clip(`${repoData.description ?? ""} ${input.projectBlurb ?? ""}`)
      });
    }

    const combinedText = [repoData.description ?? "", readmeText, demoSurface?.textContent ?? "", input.projectBlurb ?? ""]
      .join(" ")
      .trim();

    if (TECHNICAL_DEPTH_MARKERS.test(combinedText) || languages.length >= 2) {
      addFinding({
        category: "technical-depth",
        signal: "positive",
        severity: "low",
        title: "Implementation depth is visible",
        detail: "TinyFish found at least some implementation vocabulary or technical surface area beyond a simple pitch.",
        sourceIds: [repoSurface.id, readmeSurface.id]
      });
    } else {
      addFinding({
        category: "technical-depth",
        signal: "negative",
        severity: "medium",
        title: "Technical depth is not obvious yet",
        detail: "The inspected public surfaces do not clearly expose architecture, engineering depth, or technical decisions.",
        sourceIds: [repoSurface.id, readmeSurface.id]
      });
    }

    if (demoSurface && repoData.description && demoSurface.title && !includesWord(demoSurface.title, repoData.name)) {
      addFinding({
        category: "consistency",
        signal: "negative",
        severity: "low",
        title: "Demo naming does not clearly match the repo",
        detail: "The demo title and repo metadata feel slightly disconnected, which can make the story feel less coherent.",
        sourceIds: [repoSurface.id, demoSurface.id],
        evidenceSnippet: `${repoData.name} / ${demoSurface.title}`
      });
    }

    const candidateArtifacts = buildCandidateArtifacts({
      repoName: repoData.name,
      repoDescription: repoData.description ?? undefined,
      readmeContent: readme?.content,
      demoPage: demoSurface ? surfaceToFetchedPage(demoSurface) : undefined,
      blurb: input.projectBlurb,
      findings
    });

    return TinyFishInvestigationResultSchema.parse({
      repo: {
        owner: repoRef.owner,
        name: repoData.name,
        fullName: repoData.full_name,
        url: repoData.html_url,
        description: repoData.description ?? undefined,
        homepageUrl: demoUrl,
        defaultBranch: repoData.default_branch,
        languages,
        stars: repoData.stargazers_count,
        openIssues: repoData.open_issues_count,
        topics: repoData.topics ?? [],
        pushedAt: repoData.pushed_at ?? undefined,
        updatedAt: repoData.updated_at ?? undefined
      },
      surfaces,
      findings,
      candidateArtifacts,
      metadata: {
        investigationMode: "mock",
        inspectedAt: new Date().toISOString(),
        warnings,
        partialFailures
      }
    });
  }

  private async inspectOptionalSurface(
    surfaceType: TinyFishSurface["surfaceType"],
    label: string,
    url: string | undefined,
    partialFailures: string[],
    pushSurface: (surface: Omit<TinyFishSurface, "id">) => TinyFishSurface
  ) {
    if (!url) {
      return null;
    }

    try {
      const page = await fetchWebSurface(url);
      return pushSurface({
        surfaceType,
        label,
        url,
        status: "ok",
        title: page.title,
        textContent: page.text,
        snippet: page.snippet,
        notes: page.headings.slice(0, 4)
      });
    } catch (error) {
      partialFailures.push(`${label} inspection failed: ${(error as Error).message}`);
      return pushSurface({
        surfaceType,
        label,
        url,
        status: "partial",
        title: label,
        notes: ["TinyFish could not fully inspect this surface."]
      });
    }
  }
}

function surfaceToFetchedPage(surface: TinyFishSurface): FetchedWebSurface {
  return {
    title: surface.title ?? surface.label,
    url: surface.url ?? "",
    text: surface.textContent ?? "",
    snippet: surface.snippet ?? "",
    headings: surface.notes ?? []
  };
}

function buildCandidateArtifacts(args: {
  repoName: string;
  repoDescription?: string;
  readmeContent?: string;
  demoPage?: FetchedWebSurface;
  blurb?: string;
  findings: TinyFishFinding[];
}): CandidateArtifact[] {
  const { repoName, repoDescription, readmeContent, demoPage, blurb, findings } = args;

  const readmeIntro = readmeContent ? firstParagraph(readmeContent) : undefined;
  const negativeFindings = findings.filter((finding) => finding.signal === "negative");

  const artifact = (
    artifactType: CandidateArtifact["artifactType"],
    rationale: string,
    currentSnippet: string | undefined,
    relatedSignals: TinyFishFinding[]
  ): CandidateArtifact => ({
    artifactType,
    rationale,
    currentSnippet,
    impactScore: Math.min(
      10,
      Math.max(
        4,
        relatedSignals.reduce((total, finding) => total + scoreImpact(finding.signal, finding.severity), 0) /
          Math.max(1, relatedSignals.length)
      )
    )
  });

  const byTitle = (keyword: string) =>
    negativeFindings.filter(
      (finding) =>
        includesWord(finding.title, keyword) ||
        includesWord(finding.detail, keyword) ||
        includesWord(finding.category, keyword)
    );

  const artifacts: CandidateArtifact[] = [
    artifact(
      "README intro",
      "The first screen judges see should explain the product, its hook, and why it matters in one sharp pass.",
      readmeIntro ?? repoDescription,
      [...byTitle("README"), ...byTitle("pitch"), ...byTitle("clarity")]
    ),
    artifact(
      "landing page hero section",
      "If the demo page is weak, a cleaner hero can carry product framing before the judge scrolls.",
      demoPage ? `${demoPage.title}\n${demoPage.snippet}` : undefined,
      [...byTitle("demo"), ...byTitle("proof"), ...byTitle("coherent")]
    ),
    artifact(
      "30-second demo pitch",
      "A short spoken pitch is often the fastest way to repair a fuzzy product story during judging.",
      clip(blurb ?? repoDescription, 220),
      [...byTitle("clarity"), ...byTitle("different"), ...byTitle("proof")]
    ),
    artifact(
      "what judges should know section",
      "Hackathon judges reward projects that tell them exactly what is built, why it matters, and what to click first.",
      undefined,
      [...byTitle("judge"), ...byTitle("setup"), ...byTitle("usage")]
    ),
    artifact(
      "project summary",
      "A tight summary helps align the repo, demo, and submission into one coherent narrative.",
      clip(`${repoName}: ${repoDescription ?? blurb ?? ""}`, 240),
      [...byTitle("consistency"), ...byTitle("summary"), ...byTitle("clarity")]
    )
  ];

  return artifacts.sort((left, right) => right.impactScore - left.impactScore);
}
