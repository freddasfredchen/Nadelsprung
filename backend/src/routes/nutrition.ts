import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { foodItems, nutritionLogs } from "../db/schema";
import { eq, like, desc, gte, sql } from "drizzle-orm";

const router = new Hono();

const foodItemSchema = z.object({
  name: z.string().min(1).max(100),
  caloriesPer100g: z.number().positive(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

const nutritionLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodItemId: z.number().int().positive(),
  amountG: z.number().positive(),
});

// Food items
router.get("/foods", async (c) => {
  const search = c.req.query("search");
  let query = db.select().from(foodItems).orderBy(foodItems.name);
  if (search) {
    query = query.where(like(foodItems.name, `%${search}%`)) as typeof query;
  }
  return c.json(await query);
});

router.post("/foods", zValidator("json", foodItemSchema), async (c) => {
  const data = c.req.valid("json");
  const [row] = await db.insert(foodItems).values({ ...data, isCustom: true }).returning();
  return c.json(row, 201);
});

router.put("/foods/:id", zValidator("json", foodItemSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const data = c.req.valid("json");
  const [row] = await db.update(foodItems).set(data).where(eq(foodItems.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

router.delete("/foods/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(foodItems).where(eq(foodItems.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

// Nutrition logs
router.get("/logs", async (c) => {
  const date = c.req.query("date");
  let query = db
    .select({
      id: nutritionLogs.id,
      date: nutritionLogs.date,
      mealType: nutritionLogs.mealType,
      amountG: nutritionLogs.amountG,
      foodItemId: foodItems.id,
      foodName: foodItems.name,
      caloriesPer100g: foodItems.caloriesPer100g,
      protein: foodItems.protein,
      carbs: foodItems.carbs,
      fat: foodItems.fat,
    })
    .from(nutritionLogs)
    .innerJoin(foodItems, eq(foodItems.id, nutritionLogs.foodItemId))
    .orderBy(desc(nutritionLogs.date));

  if (date) {
    query = query.where(eq(nutritionLogs.date, date)) as typeof query;
  }

  return c.json(await query);
});

router.get("/logs/weekly", async (c) => {
  const rows = await db
    .select({
      date: nutritionLogs.date,
      totalCalories: sql<number>`sum(${foodItems.caloriesPer100g} * ${nutritionLogs.amountG} / 100)`,
      totalProtein: sql<number>`sum(${foodItems.protein} * ${nutritionLogs.amountG} / 100)`,
      totalCarbs: sql<number>`sum(${foodItems.carbs} * ${nutritionLogs.amountG} / 100)`,
      totalFat: sql<number>`sum(${foodItems.fat} * ${nutritionLogs.amountG} / 100)`,
    })
    .from(nutritionLogs)
    .innerJoin(foodItems, eq(foodItems.id, nutritionLogs.foodItemId))
    .where(gte(nutritionLogs.date, sql`date('now', '-7 days')`))
    .groupBy(nutritionLogs.date)
    .orderBy(nutritionLogs.date);

  return c.json(rows);
});

router.post("/logs", zValidator("json", nutritionLogSchema), async (c) => {
  const data = c.req.valid("json");
  const [row] = await db.insert(nutritionLogs).values(data).returning();
  return c.json(row, 201);
});

router.delete("/logs/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default router;
