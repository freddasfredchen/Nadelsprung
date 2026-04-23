import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db, runMigrations } from "./db/index";
import { runSeed } from "./db/seed";

import exercisesRouter from "./routes/exercises";
import workoutsRouter from "./routes/workouts";
import plansRouter from "./routes/plans";
import nutritionRouter from "./routes/nutrition";
import metricsRouter from "./routes/metrics";
import settingsRouter from "./routes/settings";

// Migrations and seed run synchronously before the server binds
try {
  console.log("Running migrations...");
  runMigrations();
  console.log("Running seed...");
  runSeed();
} catch (err) {
  console.error("Startup error (migrations/seed):", err);
  // Non-fatal: server still starts so the health check passes
}

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/exercises", exercisesRouter);
app.route("/api/workouts", workoutsRouter);
app.route("/api/plans", plansRouter);
app.route("/api/nutrition", nutritionRouter);
app.route("/api/metrics", metricsRouter);
app.route("/api/settings", settingsRouter);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

const port = Number(process.env.PORT ?? 3001);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`FitTrack backend running on http://localhost:${server.port}`);
