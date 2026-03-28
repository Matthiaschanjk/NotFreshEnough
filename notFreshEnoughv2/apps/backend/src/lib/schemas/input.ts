import { z } from "zod";
import { parseGitHubRepoUrl } from "../utils/github";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, schema.optional());

const optionalUrl = emptyToUndefined(z.string().url());
const optionalTrimmedString = emptyToUndefined(z.string().trim().max(4000));

export const JudgeProjectInputSchema = z.object({
  repoUrl: z
    .string()
    .url()
    .refine((value) => Boolean(parseGitHubRepoUrl(value)), "Please submit a valid public GitHub repository URL."),
  demoUrl: optionalUrl,
  submissionUrl: optionalUrl,
  projectBlurb: optionalTrimmedString
});

export type JudgeProjectInput = z.infer<typeof JudgeProjectInputSchema>;
