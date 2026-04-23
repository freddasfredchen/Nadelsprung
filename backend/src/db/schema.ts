import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment").notNull(),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  date: text("date").notNull(),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  planId: integer("plan_id").references(() => trainingPlans.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(),
  notes: text("notes"),
});

export const trainingPlans = sqliteTable("training_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const planDays = sqliteTable("plan_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull().references(() => trainingPlans.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0=Mon, 6=Sun
  name: text("name").notNull(),
});

export const planDayExercises = sqliteTable("plan_day_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planDayId: integer("plan_day_id").notNull().references(() => planDays.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  targetSets: integer("target_sets").notNull(),
  targetReps: text("target_reps").notNull(), // e.g. "8-12"
  orderIndex: integer("order_index").notNull().default(0),
});

export const foodItems = sqliteTable("food_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  caloriesPer100g: real("calories_per_100g").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  sugarG: real("sugar_g"),
  fiberG: real("fiber_g"),
  saltG: real("salt_g"),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const nutritionLogs = sqliteTable("nutrition_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  amountG: real("amount_g").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const bodyMetrics = sqliteTable("body_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  weightKg: real("weight_kg"),
  bodyFatPercent: real("body_fat_percent"),
  chestCm: real("chest_cm"),
  waistCm: real("waist_cm"),
  hipCm: real("hip_cm"),
  armCm: real("arm_cm"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
