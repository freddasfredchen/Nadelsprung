import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd. MMM yyyy", { locale: de });
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd.MM.", { locale: de });
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function calcCalories(caloriesPer100g: number, amountG: number): number {
  return Math.round((caloriesPer100g * amountG) / 100);
}

export function calcMacro(macro: number, amountG: number): number {
  return Math.round((macro * amountG) / 100 * 10) / 10;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const MEAL_TYPES = [
  { value: "breakfast", label: "Frühstück" },
  { value: "lunch", label: "Mittagessen" },
  { value: "dinner", label: "Abendessen" },
  { value: "snack", label: "Snack" },
] as const;

export const MUSCLE_GROUPS = [
  "Brust", "Rücken", "Schulter", "Bizeps", "Trizeps",
  "Beine", "Core", "Cardio", "Ganzkörper",
];

export const EQUIPMENT_TYPES = [
  "Langhantel", "Kurzhantel", "Kabelzug", "Maschine",
  "Körpergewicht", "Kettlebell", "Ergometer", "Fahrrad",
];
