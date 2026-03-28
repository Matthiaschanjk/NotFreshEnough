import type { JudgeProjectInput } from "../schemas/input";
import type { TinyFishInvestigationResult } from "../schemas/tinyfish";

export interface TinyFishClient {
  investigateProject(input: JudgeProjectInput): Promise<TinyFishInvestigationResult>;
}
