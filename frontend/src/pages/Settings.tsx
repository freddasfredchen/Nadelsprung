import { useEffect, useState } from "react";
import { Plus, Trash2, Download, Upload, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from "@/lib/utils";
import type { Exercise, FoodItem, Settings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ calorie_goal: "2500", protein_goal_g: "150", carbs_goal_g: "300", fat_goal_g: "80", height_cm: "175" });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [saved, setSaved] = useState(false);

  // Exercise form
  const [showExForm, setShowExForm] = useState(false);
  const [exForm, setExForm] = useState({ name: "", muscleGroup: "Brust", equipment: "Langhantel" });
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);

  // Food form
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodForm, setFoodForm] = useState({ name: "", caloriesPer100g: "", protein: "", carbs: "", fat: "" });
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
    api.exercises.list().then(setExercises).catch(console.error);
    api.nutrition.foods.list().then(setFoods).catch(console.error);
  }, []);

  const saveSettings = async () => {
    await api.settings.update(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveExercise = async () => {
    if (editingEx) {
      const updated = await api.exercises.update(editingEx.id, exForm);
      setExercises((e) => e.map((ex) => (ex.id === editingEx.id ? updated : ex)));
    } else {
      const created = await api.exercises.create(exForm);
      setExercises((e) => [...e, created]);
    }
    setShowExForm(false);
    setEditingEx(null);
    setExForm({ name: "", muscleGroup: "Brust", equipment: "Langhantel" });
  };

  const deleteExercise = async (id: number) => {
    await api.exercises.delete(id);
    setExercises((e) => e.filter((ex) => ex.id !== id));
  };

  const saveFood = async () => {
    const data = { name: foodForm.name, caloriesPer100g: Number(foodForm.caloriesPer100g), protein: Number(foodForm.protein), carbs: Number(foodForm.carbs), fat: Number(foodForm.fat) };
    if (editingFood) {
      const updated = await api.nutrition.foods.update(editingFood.id, data);
      setFoods((f) => f.map((fi) => (fi.id === editingFood.id ? updated : fi)));
    } else {
      const created = await api.nutrition.foods.create(data);
      setFoods((f) => [...f, created]);
    }
    setShowFoodForm(false);
    setEditingFood(null);
    setFoodForm({ name: "", caloriesPer100g: "", protein: "", carbs: "", fat: "" });
  };

  const deleteFood = async (id: number) => {
    await api.nutrition.foods.delete(id);
    setFoods((f) => f.filter((fi) => fi.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        await api.settings.import(data);
        alert("Import erfolgreich");
      } catch {
        alert("Import fehlgeschlagen");
      }
    };
    reader.readAsText(file);
  };

  const customExercises = exercises.filter((e) => e.isCustom);
  const defaultExercises = exercises.filter((e) => !e.isCustom);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Ziele</TabsTrigger>
          <TabsTrigger value="exercises">Übungen</TabsTrigger>
          <TabsTrigger value="foods">Lebensmittel</TabsTrigger>
          <TabsTrigger value="data">Daten</TabsTrigger>
        </TabsList>

        {/* Goals tab */}
        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ernährungs- & Körperziele</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "calorie_goal", label: "Kalorienziel (kcal/Tag)" },
                  { key: "protein_goal_g", label: "Protein-Ziel (g/Tag)" },
                  { key: "carbs_goal_g", label: "Kohlenhydrat-Ziel (g/Tag)" },
                  { key: "fat_goal_g", label: "Fett-Ziel (g/Tag)" },
                  { key: "height_cm", label: "Körpergröße (cm)" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      value={settings[key as keyof Settings]}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={saveSettings}>
                <Save className="h-4 w-4 mr-2" />
                {saved ? "Gespeichert!" : "Speichern"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercises tab */}
        <TabsContent value="exercises" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{exercises.length} Übungen gesamt</p>
            <Button size="sm" onClick={() => { setEditingEx(null); setExForm({ name: "", muscleGroup: "Brust", equipment: "Langhantel" }); setShowExForm(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Übung hinzufügen
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eigene Übungen</CardTitle>
            </CardHeader>
            <CardContent>
              {customExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Noch keine eigenen Übungen</p>
              ) : (
                <div className="space-y-1">
                  {customExercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm font-medium">{ex.name}</span>
                        <div className="flex gap-1 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{ex.muscleGroup}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{ex.equipment}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingEx(ex); setExForm({ name: ex.name, muscleGroup: ex.muscleGroup, equipment: ex.equipment }); setShowExForm(true); }}>Bearbeiten</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteExercise(ex.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Standard-Übungen ({defaultExercises.length})</CardTitle>
              <CardDescription className="text-xs">Vordefinierte Übungen können nicht gelöscht werden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {defaultExercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                    <span>{ex.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[10px]">{ex.muscleGroup}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Foods tab */}
        <TabsContent value="foods" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{foods.length} Lebensmittel</p>
            <Button size="sm" onClick={() => { setEditingFood(null); setFoodForm({ name: "", caloriesPer100g: "", protein: "", carbs: "", fat: "" }); setShowFoodForm(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Hinzufügen
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {foods.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.caloriesPer100g} kcal · P: {f.protein}g · K: {f.carbs}g · F: {f.fat}g (je 100g)</p>
                    </div>
                    {f.isCustom && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingFood(f); setFoodForm({ name: f.name, caloriesPer100g: String(f.caloriesPer100g), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat) }); setShowFoodForm(true); }}>Bearbeiten</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteFood(f.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data tab */}
        <TabsContent value="data" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Daten exportieren</CardTitle>
              <CardDescription className="text-xs">Alle Daten als JSON-Datei herunterladen</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => api.settings.export()}>
                <Download className="h-4 w-4 mr-2" /> Daten exportieren
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Daten importieren</CardTitle>
              <CardDescription className="text-xs">Übungen und Lebensmittel aus JSON-Export importieren</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span><Upload className="h-4 w-4 mr-2" /> Datei auswählen</span>
                </Button>
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exercise dialog */}
      <Dialog open={showExForm} onOpenChange={setShowExForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEx ? "Übung bearbeiten" : "Übung hinzufügen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={exForm.name} onChange={(e) => setExForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Muskelgruppe</Label>
              <Select value={exForm.muscleGroup} onValueChange={(v) => setExForm((f) => ({ ...f, muscleGroup: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select value={exForm.equipment} onValueChange={(v) => setExForm((f) => ({ ...f, equipment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EQUIPMENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExForm(false)}>Abbrechen</Button>
            <Button onClick={saveExercise} disabled={!exForm.name.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food dialog */}
      <Dialog open={showFoodForm} onOpenChange={setShowFoodForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFood ? "Lebensmittel bearbeiten" : "Lebensmittel hinzufügen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={foodForm.name} onChange={(e) => setFoodForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "caloriesPer100g", label: "Kalorien (kcal/100g)" },
                { key: "protein", label: "Protein (g/100g)" },
                { key: "carbs", label: "Kohlenhydrate (g/100g)" },
                { key: "fat", label: "Fett (g/100g)" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" step="0.1" min="0" value={foodForm[key as keyof typeof foodForm]} onChange={(e) => setFoodForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFoodForm(false)}>Abbrechen</Button>
            <Button onClick={saveFood} disabled={!foodForm.name.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
