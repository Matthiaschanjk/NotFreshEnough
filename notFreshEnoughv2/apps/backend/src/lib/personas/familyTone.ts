import type { SharedProjectAnalysis } from "../schemas/analysis";
import type { PersonaFocusPlan } from "./focusAllocator";
import type { AhGongVerdict, Verdict } from "../schemas/personas";
import type { FinalGrade } from "../analysis/grading";
import { isPassingGrade } from "../analysis/grading";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function trimSentence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return trimmed;
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function summarizePoint(detail?: string, fallback?: string) {
  if (!detail) {
    return fallback ?? "";
  }

  const sentence = detail.replace(/\s+/g, " ").trim().replace(/^[A-Z]/, (char) => char.toLowerCase());
  return sentence ? sentence.replace(/[.!?]+$/, "") : fallback ?? "";
}

export function verdictForGrade(grade: FinalGrade): Verdict {
  if (["A+", "A", "A-", "B+", "B"].includes(grade)) {
    return "Borderline";
  }

  if (["B-", "C+", "C"].includes(grade)) {
    return "Jialat";
  }

  return "Siao Liao";
}

export function buildFamilyReactionLine(grade: FinalGrade, analysis: SharedProjectAnalysis) {
  const strongest = summarizePoint(
    analysis.strongPoints[0]?.detail,
    "the basic idea is visible from the repo opening"
  );
  const weakest = summarizePoint(
    analysis.weakPoints[0]?.detail,
    "the weak spots are still easy to notice"
  );

  const reactions: Record<FinalGrade, string> = {
    "A+": `Wah, this one can show already lah, but ${weakest} so still polish a bit more first.`,
    A: `Not bad leh, the repo already shows substance, but ${weakest} so don't anyhow relax yet.`,
    "A-": `Can pass lah, and ${strongest}, but ${weakest} so tighten the loose ends first.`,
    "B+": `Almost there leh; ${strongest}, but ${weakest} so judges may still side-eye a bit.`,
    B: `Can see the effort already, but ${weakest} so this one still not fully steady leh.`,
    "B-": `Got some promise, but ${weakest} so confidence still quite shaky leh.`,
    "C+": `Aiyoh, ${strongest}, but ${weakest} so still hard to show proudly.`,
    C: `This one got effort, but ${weakest} so people may read already also not confident leh.`,
    "C-": `Aiyoh, ${weakest} and the whole thing still feels undercooked leh.`,
    "D+": `Jialat a bit; ${weakest} so the judges may lose patience quite fast.`,
    D: `Walao, ${weakest} so this one still needs serious cleanup before can face people.`,
    "D-": `Quite siao liao already; ${weakest} and not much is rescuing the first impression.`,
    F: `Siao liao lah, ${weakest} and the repo still does not inspire much confidence.`
  };

  const reaction = trimSentence(reactions[grade]);
  const bannedPhrases = ["you have disappointed your family", "you have not disappointed your family"];

  if (bannedPhrases.some((phrase) => normalize(reaction).includes(phrase))) {
    return isPassingGrade(grade)
      ? "Can pass lah, but don't get complacent."
      : "Aiyoh, still need more work before can show proudly.";
  }

  return reaction;
}

function buildVerdictExplanation(verdict: Verdict, analysis: SharedProjectAnalysis, focusPlan: PersonaFocusPlan) {
  const topStrength = summarizePoint(
    focusPlan.ahGong.strengths[0]?.detail ?? analysis.strongPoints[0]?.detail,
    "there is at least one clear project signal"
  );
  const topRisk = summarizePoint(
    focusPlan.ahGong.risks[0]?.detail ?? analysis.weakPoints[0]?.detail,
    "the weak spots are still obvious from public materials"
  );

  if (verdict === "Borderline") {
    return trimSentence(
      `Can see the repo has some standard already leh: ${topStrength}. But ${topRisk}, so still not enough punch to feel safely shiok`
    );
  }

  if (verdict === "Jialat") {
    return trimSentence(
      `Can tell there was effort, but ${topRisk}. Judges may not be convinced quickly, and that makes the whole thing feel more shaky than it should`
    );
  }

  return trimSentence(
    `This one in trouble leh: ${topRisk}. Even if ${topStrength}, the public story still too confusing or incomplete to inspire confidence`
  );
}

function buildClosingLine(verdict: Verdict, grade: FinalGrade) {
  if (verdict === "Borderline") {
    return grade === "A+" || grade === "A"
      ? "Can show people already, but still must keep standards high leh."
      : "Can pass lah, but don't get too happy first.";
  }

  if (verdict === "Jialat") {
    return "Got chance to recover, but right now still quite jialat leh.";
  }

  return "Siao liao a bit; better fix the basics before talking big.";
}

export function buildAhGongVerdictPayload(
  grade: FinalGrade,
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
): AhGongVerdict {
  const verdict = verdictForGrade(grade);

  return {
    verdict,
    explanation: buildVerdictExplanation(verdict, analysis, focusPlan),
    closingLine: buildClosingLine(verdict, grade)
  };
}

export function enforceAhGongVerdict(
  data: AhGongVerdict | undefined,
  grade: FinalGrade,
  analysis: SharedProjectAnalysis,
  focusPlan: PersonaFocusPlan
): AhGongVerdict {
  const canonical = buildAhGongVerdictPayload(grade, analysis, focusPlan);

  if (!data) {
    return canonical;
  }

  return {
    verdict: canonical.verdict,
    explanation: canonical.explanation,
    closingLine: canonical.closingLine
  };
}
