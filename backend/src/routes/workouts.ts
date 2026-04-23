import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { workouts, workoutSets, exercises } from "../db/schema";
import { eq, desc, gte, and, sql } from "drizzle-orm";

const router = new Hono();

const setSchema = z.object({
  exerciseId: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().min(0),
  notes: z.string().optional(),
});

const workoutSchema = z.object({
  title: z.string().max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  planId: z.number().int().positive().optional(),
  sets: z.array(setSchema),
});

router.get("/", async (c) => {
  const limit = Number(c.req.query("limit") ?? 20);
  const offset = Number(c.req.query("offset") ?? 0);
  const from = c.req.query("from");

  let query = db.select().from(workouts).orderBy(desc(workouts.date)).limit(limit).offset(offset);
  if (from) {
    query = query.where(gte(workouts.date, from)) as typeof query;
  }

  const rows = await query;
  return c.json(rows);
});

router.get("/stats/weekly", async (c) => {
  const rows = await db
    .select({
      date: workouts.date,
      totalSets: sql<number>`count(${workoutSets.id})`,
      totalVolume: sql<number>`sum(${workoutSets.reps} * ${workoutSets.weightKg})`,
    })
    .from(workouts)
    .leftJoin(workoutSets, eq(workoutSets.workoutId, workouts.id))
    .where(gte(workouts.date, sql`date('now', '-7 days')`))
    .groupBy(workouts.date)
    .orderBy(workouts.date);

  return c.json(rows);
});

router.get("/personal-records", async (c) => {
  const rows = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      maxWeight: sql<number>`max(${workoutSets.weightKg})`,
      maxReps: sql<number>`max(${workoutSets.reps})`,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .groupBy(workoutSets.exerciseId);

  return c.json(rows);
});

router.get("/volume/history", async (c) => {
  const period = c.req.query("period") ?? "30";
  const days = Math.min(Number(period), 365);

  const rows = await db
    .select({
      week: sql<string>`strftime('%Y-W%W', ${workouts.date})`,
      totalVolume: sql<number>`sum(${workoutSets.reps} * ${workoutSets.weightKg})`,
      workoutCount: sql<number>`count(distinct ${workouts.id})`,
    })
    .from(workouts)
    .leftJoin(workoutSets, eq(workoutSets.workoutId, workouts.id))
    .where(gte(workouts.date, sql`date('now', '-' || ${days} || ' days')`))
    .groupBy(sql`strftime('%Y-W%W', ${workouts.date})`)
    .orderBy(sql`strftime('%Y-W%W', ${workouts.date})`);

  return c.json(rows);
});

router.get("/heatmap", async (c) => {
  const rows = await db
    .select({
      date: workouts.date,
      count: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .where(gte(workouts.date, sql`date('now', '-365 days')`))
    .groupBy(workouts.date);

  return c.json(rows);
});

router.get("/last-performance/:exerciseId", async (c) => {
  const exerciseId = Number(c.req.param("exerciseId"));

  // Find the most recent workout that contained this exercise
  const rows = await db
    .select({
      date: workouts.date,
      setNumber: workoutSets.setNumber,
      reps: workoutSets.reps,
      weightKg: workoutSets.weightKg,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workouts.id, workoutSets.workoutId))
    .where(eq(workoutSets.exerciseId, exerciseId))
    .orderBy(desc(workouts.date), workoutSets.setNumber);

  if (rows.length === 0) return c.json(null);

  // Only return sets from the single most recent date
  const lastDate = rows[0].date;
  const sets = rows.filter((r) => r.date === lastDate);
  return c.json({ date: lastDate, sets });
});

router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
  if (!workout) return c.json({ error: "Not found" }, 404);

  const sets = await db
    .select({
      id: workoutSets.id,
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      setNumber: workoutSets.setNumber,
      reps: workoutSets.reps,
      weightKg: workoutSets.weightKg,
      notes: workoutSets.notes,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(eq(workoutSets.workoutId, id))
    .orderBy(workoutSets.exerciseId, workoutSets.setNumber);

  return c.json({ ...workout, sets });
});

router.post("/", zValidator("json", workoutSchema), async (c) => {
  const { sets, ...workoutData } = c.req.valid("json");

  const [workout] = await db.insert(workouts).values(workoutData).returning();

  if (sets.length > 0) {
    await db.insert(workoutSets).values(sets.map((s) => ({ ...s, workoutId: workout.id })));
  }

  return c.json(workout, 201);
});

router.put("/:id", zValidator("json", workoutSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const { sets, ...workoutData } = c.req.valid("json");

  const [workout] = await db.update(workouts).set(workoutData).where(eq(workouts.id, id)).returning();
  if (!workout) return c.json({ error: "Not found" }, 404);

  // Replace all sets
  await db.delete(workoutSets).where(eq(workoutSets.workoutId, id));
  if (sets.length > 0) {
    await db.insert(workoutSets).values(sets.map((s) => ({ ...s, workoutId: id })));
  }

  return c.json(workout);
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(workouts).where(eq(workouts.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default router;
