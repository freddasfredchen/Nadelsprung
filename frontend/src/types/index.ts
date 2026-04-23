export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
  createdAt: string;
}

export interface WorkoutSet {
  id?: number;
  exerciseId: number;
  exerciseName?: string;
  muscleGroup?: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes?: string;
}

export interface Workout {
  id: number;
  title?: string;
  date: string;
  durationMinutes?: number;
  notes?: string;
  planId?: number;
  createdAt: string;
  sets?: WorkoutSet[];
}

export interface TrainingPlan {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  days?: PlanDay[];
}

export interface PlanDay {
  id: number;
  planId: number;
  weekday: number;
  name: string;
  exercises?: PlanDayExercise[];
}

export interface PlanDayExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  targetSets: number;
  targetReps: string;
  orderIndex: number;
}

export interface FoodItem {
  id: number;
  name: string;
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  sugarG?: number | null;
  fiberG?: number | null;
  saltG?: number | null;
  isCustom: boolean;
}

export interface NutritionLog {
  id: number;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  amountG: number;
  foodItemId: number;
  foodName: string;
  caloriesPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  sugarG?: number | null;
  fiberG?: number | null;
  saltG?: number | null;
}

export interface BodyMetrics {
  id: number;
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
}

export interface Settings {
  calorie_goal: string;
  protein_goal_g: string;
  carbs_goal_g: string;
  fat_goal_g: string;
  height_cm: string;
}
