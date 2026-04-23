import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { settings, exercises, foodItems, workouts, workoutSets, bodyMetrics, nutritionLogs } from "../db/schema";
import { eq } from "drizzle-orm";

const router = new Hono();

router.get("/", async (c) => {
  const rows = await db.select().from(settings);
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return c.json(obj);
});

router.put("/", zValidator("json", z.record(z.string())), async (c) => {
  const data = c.req.valid("json");

  for (const [key, value] of Object.entries(data)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  const rows = await db.select().from(settings);
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return c.json(obj);
});

router.get("/export", async (c) => {
  const [allExercises, allWorkouts, allSets, allFoods, allLogs, allMetrics] = await Promise.all([
    db.select().from(exercises),
    db.select().from(workouts),
    db.select().from(workoutSets),
    db.select().from(foodItems),
    db.select().from(nutritionLogs),
    db.select().from(bodyMetrics),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    exercises: allExercises,
    workouts: allWorkouts,
    workoutSets: allSets,
    foodItems: allFoods,
    nutritionLogs: allLogs,
    bodyMetrics: allMetrics,
  };

  c.header("Content-Disposition", `attachment; filename="fittrack-export-${new Date().toISOString().slice(0, 10)}.json"`);
  c.header("Content-Type", "application/json");
  return c.body(JSON.stringify(exportData, null, 2));
});

const importSchema = z.object({
  exercises: z.array(z.any()).optional(),
  foodItems: z.array(z.any()).optional(),
  workouts: z.array(z.any()).optional(),
  workoutSets: z.array(z.any()).optional(),
  nutritionLogs: z.array(z.any()).optional(),
  bodyMetrics: z.array(z.any()).optional(),
});

router.post("/import", zValidator("json", importSchema), async (c) => {
  const data = c.req.valid("json");
  const counts: Record<string, number> = {};

  if (data.exercises?.length) {
    for (const e of data.exercises) {
      const { id, createdAt, ...rest } = e;
      await db.insert(exercises).values(rest).onConflictDoNothing();
    }
    counts.exercises = data.exercises.length;
  }

  if (data.foodItems?.length) {
    for (const f of data.foodItems) {
      const { id, createdAt, ...rest } = f;
      await db.insert(foodItems).values(rest).onConflictDoNothing();
    }
    counts.foodItems = data.foodItems.length;
  }

  return c.json({ success: true, imported: counts });
});

export default router;
