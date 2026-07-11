import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./env.js";
import { v1 } from "./routes/v1.js";

export function createApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET", "OPTIONS"],
    }),
  );
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/v1", v1);
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );
  return app;
}
