import type { OpenAiClient } from "../openai/client";
import { generateJsonCompletion } from "../openai/jsonCompletion";
import { SharedProjectAnalysisSchema } from "../schemas/analysis";
import type { JudgeProjectInput } from "../schemas/input";
import type { TinyFishInvestigationResult } from "../schemas/tinyfish";
import { buildHeuristicAnalysis } from "./heuristicAnalysis";
import { buildEvaluatorUserPrompt, evaluatorSystemPrompt } from "../prompts/evaluatorPrompt";
import { ensureDistinctAnalysisSections } from "./distinctAnalysis";

// This file exists to keep evaluator normalization separate from TinyFish collection.
export async function buildSharedAnalysis(args: {
  input: JudgeProjectInput;
  investigation: TinyFishInvestigationResult;
  client: OpenAiClient | null;
  model: string;
}) {
  const { input, investigation, client, model } = args;
  const heuristic = buildHeuristicAnalysis(input, investigation);

  if (!client) {
    return ensureDistinctAnalysisSections(heuristic);
  }

  try {
    const generated = await generateJsonCompletion({
      client,
      model,
      schema: SharedProjectAnalysisSchema,
      systemPrompt: evaluatorSystemPrompt,
      userPrompt: buildEvaluatorUserPrompt(input, investigation),
      temperature: 0.2
    });

    const parsed = SharedProjectAnalysisSchema.parse({
      ...heuristic,
      ...generated,
      sourcesInspected: heuristic.sourcesInspected
    });

    return ensureDistinctAnalysisSections(parsed);
  } catch {
    return ensureDistinctAnalysisSections(heuristic);
  }
}
