import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import type { Env } from "./config/env";
import { createJudgeRouter } from "./routes/judge";
import { HttpError } from "./lib/utils/httpError";

// The app file owns middleware, routing, and cross-cutting error handling.
export function createApp(env: Env) {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(",").map((value) => value.trim())
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", createJudgeRouter(env));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: error.issues[0]?.message ?? "Request validation failed."
      });
      return;
    }

    if (error instanceof HttpError) {
      response.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unexpected backend failure.";

    response.status(500).json({
      message
    });
  });

  return app;
}
