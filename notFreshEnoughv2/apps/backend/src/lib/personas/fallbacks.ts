import type { SharedProjectAnalysis } from "../schemas/analysis";
import type {
  AhGongVerdict,
  AuntyQuestions,
  KorkorRecommendations,
  KorkorRefurbishedProject,
  Verdict
} from "../schemas/personas";
import type { PersonaFocusPlan } from "./focusAllocator";

function toSentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function padToThree<T>(items: T[], factory: (index: number) => T) {
  const output = [...items];

  while (output.length < 3) {
    output.push(factory(output.length));
  }

  return output.slice(0, 3);
}

function verdictFromScores(overall: number): Verdict {
  if (overall >= 7.4) {
    return "Finalist";
  }

  if (overall >= 5.8) {
    return "Borderline";
  }

  return "Non-finalist";
}

export function buildAuntyFallback(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan): AuntyQuestions {
  const defaults = padToThree(
    focusPlan.aunty.length > 0 ? focusPlan.aunty : analysis.weakPoints.slice(0, 3),
    (index) => ({
      title: analysis.judgeConcerns[index]?.title ?? "the project story is still slippery",
      detail: analysis.judgeConcerns[index]?.detail ?? "Judges still cannot see enough proof on first contact.",
      severity: "medium" as const,
      evidenceIds: []
    })
  );

  return {
    questions: defaults.map((point) => {
      if (/missing|not obvious|under-explained|thin/i.test(`${point.title} ${point.detail}`)) {
        return `Why must judges work so hard to understand ${point.title.toLowerCase()}?`;
      }

      return `If ${point.title.toLowerCase()}, why should anyone trust this during judging?`;
    })
  };
}

export function buildAhGongFallback(analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan): AhGongVerdict {
  const verdict = verdictFromScores(analysis.scores.overall);
  const topStrength = focusPlan.ahGong.strengths[0]?.title ?? "there is a real idea here";
  const topRisk = focusPlan.ahGong.risks[0]?.title ?? "the public story is still loose";

  return {
    verdict,
    explanation:
      verdict === "Finalist"
        ? `Waseh, ${analysis.projectName} got real substance lah. But do not get too happy yet leh, because ${topRisk.toLowerCase()} can still spoil judge confidence if you leave it messy.`
        : verdict === "Borderline"
          ? `Aiyo, ${analysis.projectName} got some solid bones lah, especially ${topStrength.toLowerCase()}, but ${topRisk.toLowerCase()} still making the whole thing feel shaky leh.`
          : `Walao, ${analysis.projectName} got some spark lah, but ${topRisk.toLowerCase()} is dragging it down until judges will hesitate, leh.`,
    closingLine:
      verdict === "Finalist"
        ? "Not bad lah. Can sit at the main table, but do not anyhow relax."
        : verdict === "Borderline"
          ? "Can eat lah, but still cannot brag, leh."
          : "Alamak, go fix properly first, then come back lah."
  };
}

export function buildRecommendationsFallback(
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
): KorkorRecommendations {
  const targets = padToThree(
    focusPlan.recommendations.length > 0 ? focusPlan.recommendations : analysis.weakPoints.slice(0, 3),
    (index) => ({
      title: analysis.missingElements[index]?.title ?? "Judge-facing proof is still thin",
      detail:
        analysis.missingElements[index]?.detail ??
        "The project still needs one sharper artifact that removes ambiguity quickly.",
      severity: "medium" as const,
      evidenceIds: []
    })
  );

  return {
    recommendations: targets.map((point, index) => ({
      priority: (index + 1) as 1 | 2 | 3,
      issue: point.title,
      whyItMatters:
        index === 0
          ? `Walao, ${toSentenceCase(point.detail).toLowerCase()} Judges need this fast, otherwise they blur blur leh.`
          : index === 1
            ? `Aiyo, ${toSentenceCase(point.detail).toLowerCase()} Without clearer proof, people will not trust the project enough lah.`
            : `Alamak, ${toSentenceCase(point.detail).toLowerCase()} If the story stays patchy, judges will not remember the good parts leh.`,
      concreteAction:
        index === 0
          ? "Tighten the first 30 seconds of the repo and demo lah, so judges can see what exists, why it matters, and what to click first without guessing."
          : index === 1
            ? "Add a proper proof surface leh, like screenshots, setup steps, or a short walkthrough, so the value is obvious straight away."
            : "Make the public story consistent across the repo, demo, and submission lah, so the project feels intentional instead of stitched together."
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
