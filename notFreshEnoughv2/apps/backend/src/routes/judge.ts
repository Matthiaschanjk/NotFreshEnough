import { Router } from "express";
import type { Env } from "../config/env";
import { judgeProject } from "../lib/orchestrators/judgeProject";
import { SimilarProjectsRequestSchema } from "../lib/similarProjects/schema";
import { findSimilarProjects } from "../lib/similarProjects/service";
import { JudgeProjectInputSchema } from "../lib/schemas/input";

export function createJudgeRouter(env: Env) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "notfreshenough-backend"
    });
  });

  router.post("/judge", async (request, response, next) => {
    try {
      const input = JudgeProjectInputSchema.parse(request.body);
      const result = await judgeProject(input, env);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/similar-projects", async (request, response, next) => {
    try {
      const input = SimilarProjectsRequestSchema.parse(request.body);
      const result = await findSimilarProjects(input.github_url, env);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
