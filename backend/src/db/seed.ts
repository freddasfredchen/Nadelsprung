import { db } from "./index";
import { exercises, foodItems, trainingPlans, planDays, planDayExercises, settings } from "./schema";

const exerciseData = [
  // Chest
  { name: "Bankdrücken", muscleGroup: "Brust", equipment: "Langhantel", isCustom: false },
  { name: "Schrägbankdrücken", muscleGroup: "Brust", equipment: "Langhantel", isCustom: false },
  { name: "Kurzhantel-Fliegende", muscleGroup: "Brust", equipment: "Kurzhantel", isCustom: false },
  { name: "Kabelzug-Fliegende", muscleGroup: "Brust", equipment: "Kabelzug", isCustom: false },
  { name: "Liegestütze", muscleGroup: "Brust", equipment: "Körpergewicht", isCustom: false },
  { name: "Dips", muscleGroup: "Brust", equipment: "Körpergewicht", isCustom: false },
  // Back
  { name: "Kreuzheben", muscleGroup: "Rücken", equipment: "Langhantel", isCustom: false },
  { name: "Klimmzüge", muscleGroup: "Rücken", equipment: "Körpergewicht", isCustom: false },
  { name: "Langhantelrudern", muscleGroup: "Rücken", equipment: "Langhantel", isCustom: false },
  { name: "Kabelzug-Rudern", muscleGroup: "Rücken", equipment: "Kabelzug", isCustom: false },
  { name: "Latziehen", muscleGroup: "Rücken", equipment: "Kabelzug", isCustom: false },
  { name: "T-Bar-Rudern", muscleGroup: "Rücken", equipment: "Langhantel", isCustom: false },
  // Shoulders
  { name: "Schulterdrücken", muscleGroup: "Schulter", equipment: "Langhantel", isCustom: false },
  { name: "Kurzhantel-Schulterdrücken", muscleGroup: "Schulter", equipment: "Kurzhantel", isCustom: false },
  { name: "Seitheben", muscleGroup: "Schulter", equipment: "Kurzhantel", isCustom: false },
  { name: "Frontheben", muscleGroup: "Schulter", equipment: "Kurzhantel", isCustom: false },
  { name: "Face-Pulls", muscleGroup: "Schulter", equipment: "Kabelzug", isCustom: false },
  // Legs
  { name: "Kniebeuge", muscleGroup: "Beine", equipment: "Langhantel", isCustom: false },
  { name: "Beinpresse", muscleGroup: "Beine", equipment: "Maschine", isCustom: false },
  { name: "Rumänisches Kreuzheben", muscleGroup: "Beine", equipment: "Langhantel", isCustom: false },
  { name: "Ausfallschritte", muscleGroup: "Beine", equipment: "Kurzhantel", isCustom: false },
  { name: "Beinbeuger", muscleGroup: "Beine", equipment: "Maschine", isCustom: false },
  { name: "Beinstrecker", muscleGroup: "Beine", equipment: "Maschine", isCustom: false },
  { name: "Wadenheben", muscleGroup: "Beine", equipment: "Maschine", isCustom: false },
  { name: "Goblet Squat", muscleGroup: "Beine", equipment: "Kurzhantel", isCustom: false },
  // Biceps
  { name: "Bizepscurls", muscleGroup: "Bizeps", equipment: "Langhantel", isCustom: false },
  { name: "Kurzhantel-Curls", muscleGroup: "Bizeps", equipment: "Kurzhantel", isCustom: false },
  { name: "Hammercurls", muscleGroup: "Bizeps", equipment: "Kurzhantel", isCustom: false },
  { name: "Kabelzug-Curls", muscleGroup: "Bizeps", equipment: "Kabelzug", isCustom: false },
  // Triceps
  { name: "Trizepsdrücken", muscleGroup: "Trizeps", equipment: "Kabelzug", isCustom: false },
  { name: "Skull Crushers", muscleGroup: "Trizeps", equipment: "Langhantel", isCustom: false },
  { name: "Trizeps-Dips", muscleGroup: "Trizeps", equipment: "Körpergewicht", isCustom: false },
  { name: "Overhead Trizepsdruck", muscleGroup: "Trizeps", equipment: "Kurzhantel", isCustom: false },
  // Core
  { name: "Plank", muscleGroup: "Core", equipment: "Körpergewicht", isCustom: false },
  { name: "Crunch", muscleGroup: "Core", equipment: "Körpergewicht", isCustom: false },
  { name: "Russian Twist", muscleGroup: "Core", equipment: "Körpergewicht", isCustom: false },
  { name: "Leg Raises", muscleGroup: "Core", equipment: "Körpergewicht", isCustom: false },
  { name: "Cable Crunch", muscleGroup: "Core", equipment: "Kabelzug", isCustom: false },
  // Cardio
  { name: "Laufen", muscleGroup: "Cardio", equipment: "Körpergewicht", isCustom: false },
  { name: "Radfahren", muscleGroup: "Cardio", equipment: "Fahrrad", isCustom: false },
  { name: "Rudern", muscleGroup: "Cardio", equipment: "Ergometer", isCustom: false },
  { name: "Springseil", muscleGroup: "Cardio", equipment: "Körpergewicht", isCustom: false },
  // Compound
  { name: "Power Clean", muscleGroup: "Ganzkörper", equipment: "Langhantel", isCustom: false },
  { name: "Burpees", muscleGroup: "Ganzkörper", equipment: "Körpergewicht", isCustom: false },
  { name: "Turkish Get-Up", muscleGroup: "Ganzkörper", equipment: "Kettlebell", isCustom: false },
  { name: "Farmers Walk", muscleGroup: "Ganzkörper", equipment: "Kurzhantel", isCustom: false },
  { name: "Pull-Ups", muscleGroup: "Rücken", equipment: "Körpergewicht", isCustom: false },
  { name: "Push Press", muscleGroup: "Schulter", equipment: "Langhantel", isCustom: false },
  { name: "Front Squat", muscleGroup: "Beine", equipment: "Langhantel", isCustom: false },
  { name: "Hip Thrust", muscleGroup: "Beine", equipment: "Langhantel", isCustom: false },
];

const foodData = [
  { name: "Hähnchenbrust (gekocht)", caloriesPer100g: 165, protein: 31, carbs: 0, fat: 3.6, isCustom: false },
  { name: "Lachs", caloriesPer100g: 208, protein: 20, carbs: 0, fat: 13, isCustom: false },
  { name: "Eier (Vollei)", caloriesPer100g: 155, protein: 13, carbs: 1.1, fat: 11, isCustom: false },
  { name: "Magerquark", caloriesPer100g: 59, protein: 12, carbs: 3.5, fat: 0.2, isCustom: false },
  { name: "Griechischer Joghurt (0%)", caloriesPer100g: 59, protein: 10, carbs: 3.6, fat: 0.4, isCustom: false },
  { name: "Haferflocken", caloriesPer100g: 372, protein: 13.5, carbs: 58, fat: 7, isCustom: false },
  { name: "Vollkornnudeln (trocken)", caloriesPer100g: 348, protein: 13, carbs: 62, fat: 2.5, isCustom: false },
  { name: "Weißer Reis (trocken)", caloriesPer100g: 360, protein: 7, carbs: 80, fat: 0.6, isCustom: false },
  { name: "Süßkartoffeln", caloriesPer100g: 86, protein: 1.6, carbs: 20, fat: 0.1, isCustom: false },
  { name: "Brokkoli", caloriesPer100g: 34, protein: 2.8, carbs: 7, fat: 0.4, isCustom: false },
  { name: "Spinat", caloriesPer100g: 23, protein: 2.9, carbs: 3.6, fat: 0.4, isCustom: false },
  { name: "Banane", caloriesPer100g: 89, protein: 1.1, carbs: 23, fat: 0.3, isCustom: false },
  { name: "Apfel", caloriesPer100g: 52, protein: 0.3, carbs: 14, fat: 0.2, isCustom: false },
  { name: "Mandeln", caloriesPer100g: 579, protein: 21, carbs: 22, fat: 50, isCustom: false },
  { name: "Walnüsse", caloriesPer100g: 654, protein: 15, carbs: 14, fat: 65, isCustom: false },
  { name: "Olivenöl", caloriesPer100g: 884, protein: 0, carbs: 0, fat: 100, isCustom: false },
  { name: "Vollmilch", caloriesPer100g: 61, protein: 3.2, carbs: 4.8, fat: 3.3, isCustom: false },
  { name: "Proteinpulver (Whey)", caloriesPer100g: 380, protein: 80, carbs: 7, fat: 4, isCustom: false },
  { name: "Vollkornbrot", caloriesPer100g: 247, protein: 9, carbs: 41, fat: 3.4, isCustom: false },
  { name: "Thunfisch (Dose)", caloriesPer100g: 116, protein: 25, carbs: 0, fat: 1.4, isCustom: false },
  { name: "Rinderhackfleisch (5% Fett)", caloriesPer100g: 137, protein: 21, carbs: 0, fat: 5, isCustom: false },
  { name: "Tofu", caloriesPer100g: 76, protein: 8, carbs: 1.9, fat: 4.2, isCustom: false },
  { name: "Linsen (gekocht)", caloriesPer100g: 116, protein: 9, carbs: 20, fat: 0.4, isCustom: false },
  { name: "Kichererbsen (gekocht)", caloriesPer100g: 164, protein: 9, carbs: 27, fat: 2.6, isCustom: false },
  { name: "Avocado", caloriesPer100g: 160, protein: 2, carbs: 9, fat: 15, isCustom: false },
  { name: "Kartoffeln", caloriesPer100g: 77, protein: 2, carbs: 17, fat: 0.1, isCustom: false },
  { name: "Quinoa (gekocht)", caloriesPer100g: 120, protein: 4.4, carbs: 22, fat: 1.9, isCustom: false },
  { name: "Erdnussbutter", caloriesPer100g: 588, protein: 25, carbs: 20, fat: 50, isCustom: false },
  { name: "Hüttenkäse", caloriesPer100g: 98, protein: 11, carbs: 3.4, fat: 4.3, isCustom: false },
  { name: "Heidelbeeren", caloriesPer100g: 57, protein: 0.7, carbs: 14, fat: 0.3, isCustom: false },
];

export function runSeed() {
  const existingExercises = db.select().from(exercises).all();
  if (existingExercises.length === 0) {
    console.log("Seeding exercises...");
    db.insert(exercises).values(exerciseData).run();
  }

  const existingFood = db.select().from(foodItems).all();
  if (existingFood.length === 0) {
    console.log("Seeding food items...");
    db.insert(foodItems).values(foodData).run();
  }

  const defaultSettings = [
    { key: "calorie_goal", value: "2500" },
    { key: "protein_goal_g", value: "150" },
    { key: "carbs_goal_g", value: "300" },
    { key: "fat_goal_g", value: "80" },
    { key: "height_cm", value: "175" },
  ];
  for (const s of defaultSettings) {
    db.insert(settings).values(s).onConflictDoNothing().run();
  }

  const existingPlans = db.select().from(trainingPlans).all();
  if (existingPlans.length === 0) {
    console.log("Seeding training plan...");

    const [plan] = db
      .insert(trainingPlans)
      .values({ name: "PPL – Push Pull Legs", description: "6-Tage Push/Pull/Legs Split für Hypertrophie und Kraft", isActive: true })
      .returning();

    const allExercises = db.select().from(exercises).all();
    const byName = (name: string) => allExercises.find((e) => e.name === name);

    const days = [
      { weekday: 0, name: "Push A", exercises: [
        { name: "Bankdrücken", sets: 4, reps: "6-8" },
        { name: "Schrägbankdrücken", sets: 3, reps: "8-12" },
        { name: "Schulterdrücken", sets: 3, reps: "8-12" },
        { name: "Seitheben", sets: 3, reps: "12-15" },
        { name: "Trizepsdrücken", sets: 3, reps: "12-15" },
      ]},
      { weekday: 1, name: "Pull A", exercises: [
        { name: "Kreuzheben", sets: 4, reps: "4-6" },
        { name: "Langhantelrudern", sets: 3, reps: "8-12" },
        { name: "Latziehen", sets: 3, reps: "10-12" },
        { name: "Kabelzug-Rudern", sets: 3, reps: "10-12" },
        { name: "Bizepscurls", sets: 3, reps: "12-15" },
      ]},
      { weekday: 2, name: "Legs A", exercises: [
        { name: "Kniebeuge", sets: 4, reps: "6-8" },
        { name: "Beinpresse", sets: 3, reps: "10-12" },
        { name: "Rumänisches Kreuzheben", sets: 3, reps: "8-12" },
        { name: "Beinbeuger", sets: 3, reps: "12-15" },
        { name: "Wadenheben", sets: 4, reps: "15-20" },
      ]},
      { weekday: 3, name: "Push B", exercises: [
        { name: "Kurzhantel-Schulterdrücken", sets: 4, reps: "8-12" },
        { name: "Schrägbankdrücken", sets: 3, reps: "10-12" },
        { name: "Kabelzug-Fliegende", sets: 3, reps: "12-15" },
        { name: "Face-Pulls", sets: 3, reps: "15-20" },
        { name: "Skull Crushers", sets: 3, reps: "10-12" },
      ]},
      { weekday: 4, name: "Pull B", exercises: [
        { name: "Klimmzüge", sets: 4, reps: "6-10" },
        { name: "Kabelzug-Rudern", sets: 3, reps: "10-12" },
        { name: "Latziehen", sets: 3, reps: "10-12" },
        { name: "Hammercurls", sets: 3, reps: "12-15" },
        { name: "Kabelzug-Curls", sets: 3, reps: "12-15" },
      ]},
      { weekday: 5, name: "Legs B", exercises: [
        { name: "Front Squat", sets: 4, reps: "6-8" },
        { name: "Hip Thrust", sets: 3, reps: "10-12" },
        { name: "Ausfallschritte", sets: 3, reps: "10-12" },
        { name: "Beinstrecker", sets: 3, reps: "12-15" },
        { name: "Wadenheben", sets: 4, reps: "15-20" },
      ]},
    ];

    for (const dayData of days) {
      const [day] = db.insert(planDays).values({ planId: plan.id, weekday: dayData.weekday, name: dayData.name }).returning();
      for (let i = 0; i < dayData.exercises.length; i++) {
        const ex = byName(dayData.exercises[i].name);
        if (ex) {
          db.insert(planDayExercises).values({
            planDayId: day.id,
            exerciseId: ex.id,
            targetSets: dayData.exercises[i].sets,
            targetReps: dayData.exercises[i].reps,
            orderIndex: i,
          }).run();
        }
      }
    }
  }

  console.log("Seeding complete.");
}
