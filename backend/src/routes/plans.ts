import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { trainingPlans, planDays, planDayExercises, exercises } from "../db/schema";
import { eq } from "drizzle-orm";

const router = new Hono();

const planDayExerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  targetSets: z.number().int().positive(),
  targetReps: z.string().min(1),
  orderIndex: z.number().int().min(0).default(0),
});

const planDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  name: z.string().min(1),
  exercises: z.array(planDayExerciseSchema),
});

const planSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  days: z.array(planDaySchema),
});

router.get("/", async (c) => {
  const rows = await db.select().from(trainingPlans).orderBy(trainingPlans.createdAt);
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, id));
  if (!plan) return c.json({ error: "Not found" }, 404);

  const days = await db.select().from(planDays).where(eq(planDays.planId, id)).orderBy(planDays.weekday);

  const daysWithExercises = await Promise.all(
    days.map(async (day) => {
      const exs = await db
        .select({
          id: planDayExercises.id,
          exerciseId: planDayExercises.exerciseId,
          exerciseName: exercises.name,
          muscleGroup: exercises.muscleGroup,
          equipment: exercises.equipment,
          targetSets: planDayExercises.targetSets,
          targetReps: planDayExercises.targetReps,
          orderIndex: planDayExercises.orderIndex,
        })
        .from(planDayExercises)
        .innerJoin(exercises, eq(exercises.id, planDayExercises.exerciseId))
        .where(eq(planDayExercises.planDayId, day.id))
        .orderBy(planDayExercises.orderIndex);
      return { ...day, exercises: exs };
    })
  );

  return c.json({ ...plan, days: daysWithExercises });
});

router.post("/", zValidator("json", planSchema), async (c) => {
  const { days, ...planData } = c.req.valid("json");

  const [plan] = await db.insert(trainingPlans).values(planData).returning();

  for (const dayData of days) {
    const { exercises: exs, ...dayInfo } = dayData;
    const [day] = await db.insert(planDays).values({ ...dayInfo, planId: plan.id }).returning();
    if (exs.length > 0) {
      await db.insert(planDayExercises).values(exs.map((e) => ({ ...e, planDayId: day.id })));
    }
  }

  return c.json(plan, 201);
});

router.put("/:id", zValidator("json", planSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const { days, ...planData } = c.req.valid("json");

  const [plan] = await db.update(trainingPlans).set(planData).where(eq(trainingPlans.id, id)).returning();
  if (!plan) return c.json({ error: "Not found" }, 404);

  // Delete and recreate days
  const existingDays = await db.select().from(planDays).where(eq(planDays.planId, id));
  for (const d of existingDays) {
    await db.delete(planDayExercises).where(eq(planDayExercises.planDayId, d.id));
  }
  await db.delete(planDays).where(eq(planDays.planId, id));

  for (const dayData of days) {
    const { exercises: exs, ...dayInfo } = dayData;
    const [day] = await db.insert(planDays).values({ ...dayInfo, planId: id }).returning();
    if (exs.length > 0) {
      await db.insert(planDayExercises).values(exs.map((e) => ({ ...e, planDayId: day.id })));
    }
  }

  return c.json(plan);
});

router.patch("/:id/activate", async (c) => {
  const id = Number(c.req.param("id"));
  // Deactivate all
  await db.update(trainingPlans).set({ isActive: false });
  const [plan] = await db.update(trainingPlans).set({ isActive: true }).where(eq(trainingPlans.id, id)).returning();
  if (!plan) return c.json({ error: "Not found" }, 404);
  return c.json(plan);
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const days = await db.select().from(planDays).where(eq(planDays.planId, id));
  for (const d of days) {
    await db.delete(planDayExercises).where(eq(planDayExercises.planDayId, d.id));
  }
  await db.delete(planDays).where(eq(planDays.planId, id));
  const [row] = await db.delete(trainingPlans).where(eq(trainingPlans.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default router;
