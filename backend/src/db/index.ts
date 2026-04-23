import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DB_PATH ?? "./fittrack.db";
const sqlite = new Database(dbPath, { create: true });

// Enable WAL mode for better concurrent performance
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

export function runMigrations() {
  const migrationsFolder = path.join(import.meta.dir, "migrations");
  migrate(db, { migrationsFolder });
}
