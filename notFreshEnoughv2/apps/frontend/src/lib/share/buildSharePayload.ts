import type { JudgeProjectResponse } from "../../types/judgement";

export function buildSharePayload(result: JudgeProjectResponse, origin = window.location.origin) {
  const verdict = result.panel.ahGong.data?.verdict ?? (result.panel.statusLabel === "PASS" ? "Finalist" : "Non-finalist");
  const verdictCopy =
    verdict === "Finalist" ? "begrudgingly impressed" : verdict === "Borderline" ? "not fully convinced" : "not impressed";

  return {
    title: `NotFreshEnough: ${result.analysis.projectName}`,
    text: `TinyFish just checked my repo on NotFreshEnough and my AI relatives were ${verdictCopy}. See if your project is fresh enough:`,
    url: origin
  };
}
