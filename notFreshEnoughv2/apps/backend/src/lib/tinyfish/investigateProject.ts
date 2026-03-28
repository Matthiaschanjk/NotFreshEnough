import type { Env } from "../../config/env";
import type { JudgeProjectInput } from "../schemas/input";
import { MockTinyFishClient } from "./mockTinyFishClient";
import { RealTinyFishClient } from "./realTinyFishClient";
import type { TinyFishClient } from "./client";

export function createTinyFishClient(env: Env): TinyFishClient {
  return env.TINYFISH_MODE === "sdk" ? new RealTinyFishClient(env) : new MockTinyFishClient();
}

export async function investigateProject(input: JudgeProjectInput, env: Env) {
  const client = createTinyFishClient(env);
  return client.investigateProject(input);
}
