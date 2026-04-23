import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { runMigrations } from "./db/index";

import exercisesRouter from "./routes/exercises";
import workoutsRouter from "./routes/workouts";
import plansRouter from "./routes/plans";
import nutritionRouter from "./routes/nutrition";
import metricsRouter from "./routes/metrics";
import settingsRouter from "./routes/settings";

// Run migrations on startup
runMigrations();

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
console.log(`FitTrack backend running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
