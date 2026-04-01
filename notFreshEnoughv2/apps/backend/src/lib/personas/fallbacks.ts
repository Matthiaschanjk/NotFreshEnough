import type { SharedProjectAnalysis } from "../schemas/analysis";
import type {
  AhGongVerdict,
  AuntyQuestions,
  KorkorRecommendations,
  KorkorRefurbishedProject
} from "../schemas/personas";
import type { PersonaFocusPlan } from "./focusAllocator";
import { buildAhGongVerdictPayload } from "./familyTone";

type ReviewCategory =
  | "Judge-facing clarity"
  | "Technical robustness"
  | "Demo/UX"
  | "Data & evaluation"
  | "Potential risks"
  | "Suggested improvements";

interface ReviewItem {
  category: ReviewCategory;
  title: string;
  rationale: string;
  action: string;
  judgeFacing: boolean;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function padToThree<T>(items: T[], factory: (index: number) => T) {
  const output = [...items];

  while (output.length < 3) {
    output.push(factory(output.length));
  }

  return output.slice(0, 3);
}

function uniqueByKey<T>(items: T[], keyOf: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function findSignal(
  analysis: SharedProjectAnalysis,
  matcher: RegExp
) {
  return [...analysis.weakPoints, ...analysis.missingElements, ...analysis.judgeConcerns, ...analysis.strongPoints].find((point) =>
    matcher.test(`${point.title} ${point.detail}`)
  );
}

function inferDemoPresence(analysis: SharedProjectAnalysis) {
  const negativeSignals = [...analysis.weakPoints, ...analysis.missingElements].some((point) =>
    /(missing demo|no demo|live demo|walkthrough|preview)/i.test(`${point.title} ${point.detail}`)
  );

  if (negativeSignals) {
    return false;
  }

  return (
    analysis.sourcesInspected.some((source) => source.surfaceType === "demo" || /demo|preview|live/i.test(source.label)) ||
    analysis.evidence.some((item) => /demo|walkthrough|preview|live/i.test(`${item.title} ${item.detail} ${item.excerpt ?? ""}`))
  );
}

function inferDocsQuality(analysis: SharedProjectAnalysis) {
  if (analysis.scores.completeness >= 7.5) {
    return "high";
  }

  if (analysis.scores.completeness >= 5) {
    return "medium";
  }

  return "low";
}

function recommendAction(point: { title: string; detail: string }, fallback: string) {
  const text = `${point.title} ${point.detail}`;

  if (/demo|walkthrough|preview|onboarding/i.test(text)) {
    return "Add a live demo link or a 60-second walkthrough at the top of the README.";
  }

  if (/maintenance|risk|scale|scalability|traffic|boundary|operations/i.test(text)) {
    return "Document the maintenance boundary, scale assumptions, and one mitigation note in the README.";
  }

  if (/judge|summary|story|clarity|under-explained|not obvious/i.test(text)) {
    return "Add a one-paragraph 'What Judges Should Know' section near the top of the README.";
  }

  if (/setup|install|reproduc|environment|run locally/i.test(text)) {
    return "Add a verified quickstart with one command, dependencies, and the expected output.";
  }

  if (/metric|evaluation|benchmark|dataset|data/i.test(text)) {
    return "Add a short evaluation section with dataset, metric, baseline, and one representative result.";
  }

  if (/architecture|pipeline|test|performance|scal|reliab/i.test(text)) {
    return "Document the architecture, test path, and one reproducibility command in the README.";
  }

  return fallback;
}

function buildReviewItems(analysis: SharedProjectAnalysis, _focusPlan: PersonaFocusPlan): ReviewItem[] {
  const docsQuality = inferDocsQuality(analysis);
  const demoPresent = inferDemoPresence(analysis);
  const shouldIncludeJudgeFacing =
    analysis.scores.clarity < 7 ||
    docsQuality !== "high" ||
    analysis.judgeConcerns.some((point) =>
      /judge|summary|clarity|first impression|orientation|readme/i.test(`${point.title} ${point.detail}`)
    );

  const judgeSignal =
    analysis.judgeConcerns[0] ??
    analysis.missingElements.find((point) => /judge|summary|clarity|story|readme/i.test(`${point.title} ${point.detail}`)) ??
    analysis.weakPoints[0] ?? {
      title: "Judge-facing clarity needs a cleaner opening",
      detail: "The project story is not yet compressed into a fast first-read explanation.",
      severity: "medium" as const,
      evidenceIds: []
    };
  const technicalSignal =
    findSignal(analysis, /architecture|reproduc|setup|pipeline|test|dependency|performance|scal|reliab|technical/i) ??
    analysis.weakPoints[0] ?? {
      title: "Technical robustness needs clearer proof",
      detail: "Implementation strength is harder to validate from the current public materials.",
      severity: "medium" as const,
      evidenceIds: []
    };
  const demoSignal =
    findSignal(analysis, /demo|walkthrough|preview|ux|user flow|onboarding|install/i) ?? {
      title: "Demo experience can be easier to verify",
      detail: demoPresent
        ? "The project has demo signals, but the first-run path can still be made more obvious."
        : "There is no strong public demo signal yet, so the product value remains harder to verify quickly.",
      severity: "medium" as const,
      evidenceIds: []
    };
  const dataSignal =
    findSignal(analysis, /metric|evaluation|benchmark|dataset|data|evidence/i) ?? {
      title: "Data and evaluation proof can be stronger",
      detail: "The public materials do not yet make validation criteria and evidence thresholds obvious.",
      severity: "medium" as const,
      evidenceIds: []
    };
  const riskSignal =
    analysis.weakPoints.find((point) => point.severity === "high") ??
    analysis.weakPoints[0] ?? {
      title: "A maintenance risk remains visible",
      detail: "The strongest failure mode is still easy to notice in the current public surfaces.",
      severity: "medium" as const,
      evidenceIds: []
    };
  const improvementSignal =
    analysis.missingElements[0] ??
    analysis.weakPoints[1] ??
    analysis.strongPoints[0] ?? {
      title: "A quick improvement can sharpen the public story",
      detail: "One additional artifact would make the repo easier to evaluate quickly.",
      severity: "medium" as const,
      evidenceIds: []
    };

  const candidates: ReviewItem[] = [
    {
      category: "Judge-facing clarity",
      title: "Judge-facing clarity",
      rationale: normalizeText(judgeSignal.detail),
      action: recommendAction(judgeSignal, "Move the core value, proof, and first-click path into the README opening."),
      judgeFacing: true
    },
    {
      category: "Technical robustness",
      title: "Technical robustness",
      rationale: normalizeText(technicalSignal.detail),
      action: recommendAction(technicalSignal, "Document the implementation path so reviewers can verify the architecture quickly."),
      judgeFacing: false
    },
    {
      category: "Demo/UX",
      title: "Demo and onboarding",
      rationale: normalizeText(demoSignal.detail),
      action: recommendAction(demoSignal, "Make the first successful interaction obvious in the repo and demo surfaces."),
      judgeFacing: false
    },
    {
      category: "Data & evaluation",
      title: "Data and evaluation",
      rationale: normalizeText(dataSignal.detail),
      action: recommendAction(dataSignal, "Show one measurable result with its dataset or evaluation setup."),
      judgeFacing: false
    },
    {
      category: "Potential risks",
      title: "Potential risk",
      rationale: normalizeText(riskSignal.detail),
      action: recommendAction(riskSignal, "Add one mitigation note so the main failure mode looks intentional rather than accidental."),
      judgeFacing: false
    },
    {
      category: "Suggested improvements",
      title: "Suggested improvement",
      rationale: normalizeText(improvementSignal.detail),
      action: recommendAction(
        improvementSignal,
        "Add one concrete proof artifact so the strongest project claim is easy to validate."
      ),
      judgeFacing: false
    }
  ];

  const preferredCategories = shouldIncludeJudgeFacing
    ? ["Judge-facing clarity", "Technical robustness", "Demo/UX", "Data & evaluation", "Potential risks", "Suggested improvements"]
    : ["Technical robustness", "Demo/UX", "Potential risks", "Suggested improvements", "Data & evaluation"];

  const chosen: ReviewItem[] = [];

  for (const category of preferredCategories) {
    const item = candidates.find((candidate) => candidate.category === category);
    if (!item) {
      continue;
    }

    chosen.push(item);

    if (chosen.length === 3) {
      break;
    }
  }

  return uniqueByKey(chosen, (item) => item.category).slice(0, 3);
}

export function buildAuntyFallback(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan): AuntyQuestions {
  const defaults = padToThree(buildReviewItems(analysis, focusPlan), (index) => {
    const signal = analysis.weakPoints[index] ?? analysis.missingElements[index] ?? analysis.judgeConcerns[index];

    return {
      category: "Suggested improvements" as const,
      title: signal?.title ?? "Suggested improvement",
      rationale: normalizeText(signal?.detail ?? "One more concrete proof surface would make the project easier to assess."),
      action: recommendAction(
        signal ?? { title: "Suggested improvement", detail: "The public repo still needs one more proof artifact." },
        "Add one concrete next-step artifact that makes the project easier to verify."
      ),
      judgeFacing: false
    };
  });

  return {
    questions: defaults.map((item) => `${item.title}: ${item.rationale} ${item.action}`)
  };
}

export function buildAhGongFallback(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan): AhGongVerdict {
  return buildAhGongVerdictPayload(analysis.scores.overallGrade, analysis, focusPlan);
}

export function buildRecommendationsFallback(
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
): KorkorRecommendations {
  const targets = padToThree(buildReviewItems(analysis, focusPlan), (index) => {
    const signal = analysis.missingElements[index] ?? analysis.weakPoints[index] ?? analysis.judgeConcerns[index];

    return {
      category: "Suggested improvements" as const,
      title: signal?.title ?? "Suggested improvement",
      rationale: normalizeText(signal?.detail ?? "The project still needs one sharper artifact that removes ambiguity quickly."),
      action: recommendAction(
        signal ?? { title: "Suggested improvement", detail: "The public repo still needs one sharper artifact." },
        "Add one concise proof artifact that reduces ambiguity quickly."
      ),
      judgeFacing: false
    };
  });

  return {
    recommendations: targets.map((item, index) => ({
      priority: (index + 1) as 1 | 2 | 3,
      issue: item.title,
      whyItMatters: item.rationale,
      concreteAction: item.action
    }))
  };
}

function buildArtifactBody(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  const artifactType = focusPlan.refurbished.artifactType;
  const strongest = analysis.strongPoints.slice(0, 2).map((point) => point.title);
  const risk = focusPlan.refurbished.supportingWeaknesses[0]?.title ?? "the product story is still fuzzy";

  switch (artifactType) {
    case "README intro":
      return {
        title: `${analysis.projectName}: a sharper README opening`,
        content: `# ${analysis.projectName}\n\n${analysis.projectName} helps judges and users understand the project in one pass instead of digging through scattered repo clues. It combines ${strongest.join(
          " and "
        ).toLowerCase()} into a clearer, demo-ready product story.\n\n## Why it matters\n- Solves a visible problem with a concrete product surface\n- Gives judges a fast path to understand value, proof, and implementation depth\n- Reduces the risk that ${risk.toLowerCase()}`
      };
    case "landing page hero section":
      return {
        title: `${analysis.projectName} hero section`,
        content: `Headline: ${analysis.projectName} turns messy project surfaces into a judge-ready story.\nSubheadline: TinyFish investigates the repo, demo, and docs, then distills the strongest signals so judges can understand the build without hunting for proof.\nPrimary CTA: See the live judgement\nProof points:\n- Clear value proposition in one glance\n- Demo-backed evidence instead of vague claims\n- Stronger framing around ${strongest[0]?.toLowerCase() ?? "the core build"}`
      };
    case "30-second demo pitch":
      return {
        title: `${analysis.projectName} demo pitch`,
        content: `“${analysis.projectName} is built to make project judging faster and more honest. TinyFish investigates the messy repo, demo, and submission trail, then turns that evidence into a clear judgement panel instead of generic feedback. The result is a product that is memorable on stage, grounded in real project signals, and much harder for judges to dismiss as a joke.”`
      };
    case "what judges should know section":
      return {
        title: `What judges should know about ${analysis.projectName}`,
        content: `## What judges should know\n- Core value: ${analysis.summary}\n- Best evidence right now: ${analysis.strongPoints
          .slice(0, 2)
          .map((point) => point.detail)
          .join(" ")}\n- Current risk: ${risk}\n- What to click first: Open the repo, inspect the main demo surface, then review the refined artifact below to see the product story without guesswork.`
      };
    case "project summary":
    default:
      return {
        title: `${analysis.projectName} summary`,
        content: `${analysis.projectName} is a hackathon project that uses TinyFish to inspect public project surfaces and turn scattered evidence into a more credible judging story. Its strongest signals today are ${strongest.join(
          " and "
        ).toLowerCase()}, while the main refurbishment goal is to reduce confusion around ${risk.toLowerCase()}.`
      };
  }
}

export function buildRefurbishedFallback(
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
): KorkorRefurbishedProject {
  const artifact = buildArtifactBody(analysis, focusPlan);

  return {
    artifactType: focusPlan.refurbished.artifactType,
    reason: focusPlan.refurbished.reason,
    title: artifact.title,
    content: artifact.content
  };
}
