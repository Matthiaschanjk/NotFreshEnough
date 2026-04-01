import type { Env } from "../../config/env";
import { buildSharedAnalysis } from "../analysis/buildSharedAnalysis";
import { createOpenAiClient } from "../openai/client";
import { generateFamilyPanel } from "../personas/generateFamilyPanel";
import { allocatePersonaFocus } from "../personas/focusAllocator";
import type { JudgeProjectInput } from "../schemas/input";
import { JudgeProjectResponseSchema } from "../schemas/response";
import { investigateProject } from "../tinyfish/investigateProject";
import { createId } from "../utils/ids";
import { isPassingGrade } from "../analysis/grading";
import { buildFamilyReactionLine } from "../personas/familyTone";

export async function judgeProject(input: JudgeProjectInput, env: Env) {
  const requestId = createId("judge");
  const llmClient = createOpenAiClient(env);
  const investigation = await investigateProject(input, env);
  const analysis = await buildSharedAnalysis({
    input,
    investigation,
    client: llmClient,
    model: env.OPENAI_MODEL
  });
  const focusPlan = allocatePersonaFocus(analysis);
  const personas = await generateFamilyPanel({
    analysis,
    focusPlan,
    client: llmClient,
    model: env.OPENAI_MODEL
  });

  const passing = isPassingGrade(analysis.scores.overallGrade);

  return JudgeProjectResponseSchema.parse({
    requestId,
    generatedAt: new Date().toISOString(),
    inputEcho: input,
    analysis,
    tinyFish: {
      investigationMode: investigation.metadata.investigationMode,
      warnings: [...investigation.metadata.warnings, ...investigation.metadata.partialFailures],
      sourcesInspected: analysis.sourcesInspected.length
    },
    panel: {
      familyHeadline: buildFamilyReactionLine(analysis.scores.overallGrade, analysis),
      statusLabel: passing ? "PASS" : "FAIL",
      ...personas
    }
  });
}
