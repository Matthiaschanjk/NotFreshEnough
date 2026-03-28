import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const envCandidates = [
  resolve(process.cwd(), "src/config/.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "apps/backend/src/config/.env"),
  resolve(process.cwd(), "apps/backend/.env"),
  resolve(process.cwd(), ".env")
];

for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, schema.optional());

const EnvSchema = z.object({
  BACKEND_PORT: z.coerce.number().int().positive().default(8787),
  FRONTEND_ORIGIN: z.string().trim().min(1).default("http://localhost:5173"),
  GITHUB_TOKEN: emptyToUndefined(z.string().trim().min(1)),
  BING_SEARCH_KEY: emptyToUndefined(z.string().trim().min(1)),
  OPENAI_API_KEY: emptyToUndefined(z.string().trim().min(1)),
  OPENAI_BASE_URL: emptyToUndefined(z.string().url()),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  TINYFISH_MODE: z.enum(["mock", "sdk"]).default("mock"),
  TINYFISH_API_KEY: emptyToUndefined(z.string().trim().min(1)),
  TINYFISH_BASE_URL: emptyToUndefined(z.string().url())
});

export const env = EnvSchema.parse(process.env);

export type Env = typeof env;
