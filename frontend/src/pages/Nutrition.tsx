import { useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { todayISO, calcCalories, calcMacro, MEAL_TYPES } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { NutritionLog, FoodItem, Settings } from "@/types";

const TOOLTIP_STYLE = { background: "hsl(222 47% 13%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 6, fontSize: 12 };

export default function NutritionPage() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ date: string; totalCalories: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [amount, setAmount] = useState("100");

  const loadLogs = () => api.nutrition.logs.list(selectedDate).then(setLogs).catch(console.error);

  useEffect(() => {
    api.nutrition.foods.list().then(setFoods).catch(console.error);
    api.settings.get().then(setSettings).catch(console.error);
    api.nutrition.logs.weekly().then(setWeeklyData).catch(console.error);
  }, []);

  useEffect(() => { loadLogs(); }, [selectedDate]);

  const totalCalories = logs.reduce((s, l) => s + calcCalories(l.caloriesPer100g, l.amountG), 0);
  const totalProtein = logs.reduce((s, l) => s + calcMacro(l.protein, l.amountG), 0);
  const totalCarbs = logs.reduce((s, l) => s + calcMacro(l.carbs, l.amountG), 0);
  const totalFat = logs.reduce((s, l) => s + calcMacro(l.fat, l.amountG), 0);

  const calorieGoal = Number(settings?.calorie_goal ?? 2500);
  const proteinGoal = Number(settings?.protein_goal_g ?? 150);
  const carbsGoal = Number(settings?.carbs_goal_g ?? 300);
  const fatGoal = Number(settings?.fat_goal_g ?? 80);

  const addLog = async () => {
    if (!selectedFood) return;
    await api.nutrition.logs.create({ date: selectedDate, mealType, foodItemId: selectedFood.id, amountG: Number(amount) });
    setShowAdd(false);
    setSelectedFood(null);
    setAmount("100");
    setSearch("");
    loadLogs();
    api.nutrition.logs.weekly().then(setWeeklyData);
  };

  const deleteLog = async (id: number) => {
    await api.nutrition.logs.delete(id);
    loadLogs();
    api.nutrition.logs.weekly().then(setWeeklyData);
  };

  const filteredFoods = foods.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const groupedLogs = MEAL_TYPES.reduce<Record<string, NutritionLog[]>>((acc, m) => {
    acc[m.value] = logs.filter((l) => l.mealType === m.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ernährung</h1>
        <div className="flex gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Mahlzeit
          </Button>
        </div>
      </div>

      {/* Daily summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tagesübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{totalCalories}</p>
              <p className="text-xs text-muted-foreground">von {calorieGoal} kcal</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {calorieGoal - totalCalories > 0 ? `${calorieGoal - totalCalories} kcal verbleibend` : "Ziel erreicht!"}
            </div>
          </div>
          <Progress value={Math.min((totalCalories / calorieGoal) * 100, 100)} />

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: "Protein", value: totalProtein, goal: proteinGoal, color: "bg-blue-500" },
              { label: "Kohlenhydrate", value: totalCarbs, goal: carbsGoal, color: "bg-yellow-500" },
              { label: "Fett", value: totalFat, goal: fatGoal, color: "bg-orange-500" },
            ].map(({ label, value, goal, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}g</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min((value / goal) * 100, 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">/ {goal}g</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="space-y-3">
        {MEAL_TYPES.map(({ value, label }) => (
          <Card key={value}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {Math.round(groupedLogs[value].reduce((s, l) => s + calcCalories(l.caloriesPer100g, l.amountG), 0))} kcal
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {groupedLogs[value].length === 0 ? (
                <p className="text-muted-foreground text-xs py-1">Keine Einträge</p>
              ) : (
                <div className="space-y-1">
                  {groupedLogs[value].map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm">{log.foodName}</p>
                        <p className="text-xs text-muted-foreground">{log.amountG}g · P: {calcMacro(log.protein, log.amountG)}g · K: {calcMacro(log.carbs, log.amountG)}g · F: {calcMacro(log.fat, log.amountG)}g</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{calcCalories(log.caloriesPer100g, log.amountG)} kcal</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLog(log.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Wöchentliche Kalorien</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Keine Daten</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${Math.round(v)} kcal`, "Kalorien"]} />
                <Bar dataKey="totalCalories" fill="hsl(245 60% 64%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Add log dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mahlzeit hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mahlzeit</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as typeof mealType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lebensmittel suchen</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Suchen..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-md p-1">
                {filteredFoods.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFood(f)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedFood?.id === f.id ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{f.caloriesPer100g} kcal/100g</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedFood && (
              <div className="space-y-2">
                <Label>Menge (g)</Label>
                <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  = {calcCalories(selectedFood.caloriesPer100g, Number(amount))} kcal · P: {calcMacro(selectedFood.protein, Number(amount))}g · K: {calcMacro(selectedFood.carbs, Number(amount))}g · F: {calcMacro(selectedFood.fat, Number(amount))}g
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Button>
            <Button onClick={addLog} disabled={!selectedFood}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
