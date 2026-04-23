const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  // Handle empty responses (204 etc.)
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Exercises
export const api = {
  exercises: {
    list: (params?: { search?: string; muscleGroup?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<import("@/types").Exercise[]>(`/exercises${q ? "?" + q : ""}`);
    },
    create: (data: Omit<import("@/types").Exercise, "id" | "createdAt" | "isCustom">) =>
      request<import("@/types").Exercise>("/exercises", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Omit<import("@/types").Exercise, "id" | "createdAt" | "isCustom">) =>
      request<import("@/types").Exercise>(`/exercises/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/exercises/${id}`, { method: "DELETE" }),
  },

  workouts: {
    list: (params?: { limit?: number; offset?: number; from?: string }) => {
      const q = new URLSearchParams(Object.entries(params ?? {}).map(([k, v]) => [k, String(v)])).toString();
      return request<import("@/types").Workout[]>(`/workouts${q ? "?" + q : ""}`);
    },
    get: (id: number) => request<import("@/types").Workout>(`/workouts/${id}`),
    create: (data: Omit<import("@/types").Workout, "id" | "createdAt"> & { sets: import("@/types").WorkoutSet[] }) =>
      request<import("@/types").Workout>("/workouts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Omit<import("@/types").Workout, "id" | "createdAt"> & { sets: import("@/types").WorkoutSet[] }) =>
      request<import("@/types").Workout>(`/workouts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/workouts/${id}`, { method: "DELETE" }),
    weeklyStats: () => request<{ date: string; totalSets: number; totalVolume: number }[]>("/workouts/stats/weekly"),
    personalRecords: () =>
      request<{ exerciseId: number; exerciseName: string; muscleGroup: string; maxWeight: number; maxReps: number }[]>(
        "/workouts/personal-records"
      ),
    volumeHistory: (period: number) => request<{ week: string; totalVolume: number; workoutCount: number }[]>(`/workouts/volume/history?period=${period}`),
    heatmap: () => request<{ date: string; count: number }[]>("/workouts/heatmap"),
  },

  plans: {
    list: () => request<import("@/types").TrainingPlan[]>("/plans"),
    get: (id: number) => request<import("@/types").TrainingPlan>(`/plans/${id}`),
    create: (data: unknown) => request<import("@/types").TrainingPlan>("/plans", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: unknown) =>
      request<import("@/types").TrainingPlan>(`/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    activate: (id: number) => request<import("@/types").TrainingPlan>(`/plans/${id}/activate`, { method: "PATCH" }),
    delete: (id: number) => request<{ success: boolean }>(`/plans/${id}`, { method: "DELETE" }),
  },

  nutrition: {
    foods: {
      list: (search?: string) => {
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        return request<import("@/types").FoodItem[]>(`/nutrition/foods${q}`);
      },
      create: (data: Omit<import("@/types").FoodItem, "id" | "isCustom">) =>
        request<import("@/types").FoodItem>("/nutrition/foods", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Omit<import("@/types").FoodItem, "id" | "isCustom">) =>
        request<import("@/types").FoodItem>(`/nutrition/foods/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: number) => request<{ success: boolean }>(`/nutrition/foods/${id}`, { method: "DELETE" }),
    },
    logs: {
      list: (date?: string) => {
        const q = date ? `?date=${date}` : "";
        return request<import("@/types").NutritionLog[]>(`/nutrition/logs${q}`);
      },
      weekly: () => request<{ date: string; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number }[]>("/nutrition/logs/weekly"),
      create: (data: Omit<import("@/types").NutritionLog, "id" | "foodName" | "caloriesPer100g" | "protein" | "carbs" | "fat">) =>
        request<import("@/types").NutritionLog>("/nutrition/logs", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: number) => request<{ success: boolean }>(`/nutrition/logs/${id}`, { method: "DELETE" }),
    },
  },

  metrics: {
    list: (period?: number) => {
      const q = period ? `?period=${period}` : "";
      return request<import("@/types").BodyMetrics[]>(`/metrics${q}`);
    },
    latest: () => request<import("@/types").BodyMetrics | null>("/metrics/latest"),
    create: (data: Omit<import("@/types").BodyMetrics, "id">) =>
      request<import("@/types").BodyMetrics>("/metrics", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/metrics/${id}`, { method: "DELETE" }),
  },

  settings: {
    get: () => request<import("@/types").Settings>("/settings"),
    update: (data: Partial<import("@/types").Settings>) =>
      request<import("@/types").Settings>("/settings", { method: "PUT", body: JSON.stringify(data) }),
    export: () => window.open(`${BASE}/settings/export`, "_blank"),
    import: (data: unknown) =>
      request<{ success: boolean; imported: Record<string, number> }>("/settings/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
