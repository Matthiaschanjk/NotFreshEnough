import type { Env } from "../../config/env";
import type { JudgeProjectInput } from "../schemas/input";
import type { TinyFishInvestigationResult } from "../schemas/tinyfish";
import type { TinyFishClient } from "./client";

// This file exists so the real TinyFish SDK can replace the mock client without
// changing the rest of the orchestration pipeline.
export class RealTinyFishClient implements TinyFishClient {
  constructor(private readonly env: Env) {}

  async investigateProject(_: JudgeProjectInput): Promise<TinyFishInvestigationResult> {
    void this.env;

    throw new Error(
      "TinyFish SDK mode is selected, but the real TinyFish client adapter is still a TODO. Replace this file with the official SDK integration."
    );
  }
}
