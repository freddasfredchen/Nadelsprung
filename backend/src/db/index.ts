import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const dbPath = process.env.DB_PATH ?? "./fittrack.db";
const sqlite = new Database(dbPath, { create: true });

sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

// Create all tables directly — idempotent, no migration tracker needed
export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      equipment TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT,
      date TEXT NOT NULL,
      duration_minutes INTEGER,
      notes TEXT,
      plan_id INTEGER REFERENCES training_plans(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS plan_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plan_day_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      plan_day_id INTEGER NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      target_sets INTEGER NOT NULL,
      target_reps TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      calories_per_100g REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_item_id INTEGER NOT NULL REFERENCES food_items(id),
      amount_g REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      date TEXT NOT NULL UNIQUE,
      weight_kg REAL,
      body_fat_percent REAL,
      chest_cm REAL,
      waist_cm REAL,
      hip_cm REAL,
      arm_cm REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `);

  // Add title column to existing databases that predate this field
  try {
    sqlite.exec("ALTER TABLE workouts ADD COLUMN title TEXT;");
  } catch {
    // Column already exists — safe to ignore
  }

  // Add extended nutrition columns to food_items
  try { sqlite.exec("ALTER TABLE food_items ADD COLUMN sugar_g REAL;"); } catch { /* already exists */ }
  try { sqlite.exec("ALTER TABLE food_items ADD COLUMN fiber_g REAL;"); } catch { /* already exists */ }
  try { sqlite.exec("ALTER TABLE food_items ADD COLUMN salt_g REAL;"); } catch { /* already exists */ }
}
