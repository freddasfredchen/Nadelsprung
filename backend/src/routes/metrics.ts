import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { bodyMetrics, settings } from "../db/schema";
import { eq, desc, gte, sql } from "drizzle-orm";

const router = new Hono();

const metricsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().optional(),
  bodyFatPercent: z.number().min(1).max(60).optional(),
  chestCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional(),
  armCm: z.number().positive().optional(),
});

router.get("/", async (c) => {
  const period = c.req.query("period") ?? "90";
  const days = Math.min(Number(period), 365);

  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(gte(bodyMetrics.date, sql`date('now', '-' || ${days} || ' days')`))
    .orderBy(bodyMetrics.date);

  return c.json(rows);
});

router.get("/latest", async (c) => {
  const [row] = await db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).limit(1);
  return c.json(row ?? null);
});

router.post("/", zValidator("json", metricsSchema), async (c) => {
  const data = c.req.valid("json");

  // Upsert by date
  const [row] = await db
    .insert(bodyMetrics)
    .values(data)
    .onConflictDoUpdate({ target: bodyMetrics.date, set: data })
    .returning();

  return c.json(row, 201);
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(bodyMetrics).where(eq(bodyMetrics.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default router;
