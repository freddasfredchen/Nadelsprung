CREATE TABLE IF NOT EXISTS `exercises` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `muscle_group` text NOT NULL,
  `equipment` text NOT NULL,
  `is_custom` integer DEFAULT false NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `training_plans` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `is_active` integer DEFAULT false NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `workouts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL,
  `duration_minutes` integer,
  `notes` text,
  `plan_id` integer REFERENCES `training_plans`(`id`),
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `workout_sets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_id` integer NOT NULL REFERENCES `workouts`(`id`) ON DELETE CASCADE,
  `exercise_id` integer NOT NULL REFERENCES `exercises`(`id`),
  `set_number` integer NOT NULL,
  `reps` integer NOT NULL,
  `weight_kg` real NOT NULL,
  `notes` text
);

CREATE TABLE IF NOT EXISTS `plan_days` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `plan_id` integer NOT NULL REFERENCES `training_plans`(`id`) ON DELETE CASCADE,
  `weekday` integer NOT NULL,
  `name` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `plan_day_exercises` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `plan_day_id` integer NOT NULL REFERENCES `plan_days`(`id`) ON DELETE CASCADE,
  `exercise_id` integer NOT NULL REFERENCES `exercises`(`id`),
  `target_sets` integer NOT NULL,
  `target_reps` text NOT NULL,
  `order_index` integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS `food_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `calories_per_100g` real NOT NULL,
  `protein` real NOT NULL,
  `carbs` real NOT NULL,
  `fat` real NOT NULL,
  `is_custom` integer DEFAULT false NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `nutrition_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL,
  `meal_type` text NOT NULL,
  `food_item_id` integer NOT NULL REFERENCES `food_items`(`id`),
  `amount_g` real NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `body_metrics` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL UNIQUE,
  `weight_kg` real,
  `body_fat_percent` real,
  `chest_cm` real,
  `waist_cm` real,
  `hip_cm` real,
  `arm_cm` real,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL UNIQUE,
  `value` text NOT NULL
);
