import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { exercises } from "../db/schema";
import { eq, like, or } from "drizzle-orm";

const router = new Hono();

const exerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.string().min(1),
  equipment: z.string().min(1),
});

router.get("/", async (c) => {
  const search = c.req.query("search");
  const muscleGroup = c.req.query("muscleGroup");

  let query = db.select().from(exercises);

  if (search) {
    query = query.where(like(exercises.name, `%${search}%`)) as typeof query;
  }
  if (muscleGroup) {
    query = query.where(eq(exercises.muscleGroup, muscleGroup)) as typeof query;
  }

  const rows = await query;
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.post("/", zValidator("json", exerciseSchema), async (c) => {
  const data = c.req.valid("json");
  const [row] = await db.insert(exercises).values({ ...data, isCustom: true }).returning();
  return c.json(row, 201);
});

router.put("/:id", zValidator("json", exerciseSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const data = c.req.valid("json");
  const [row] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(exercises).where(eq(exercises.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default router;
