import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const dbPath = process.env.DB_PATH ?? "./fittrack.db";
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function runMigrations() {
  const migrationsFolder = path.join(import.meta.dir, "migrations");
  migrate(db, { migrationsFolder });
}
