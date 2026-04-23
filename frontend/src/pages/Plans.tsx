import { useEffect, useState } from "react";
import { Plus, Check, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { WEEKDAYS, MUSCLE_GROUPS } from "@/lib/utils";
import type { TrainingPlan, Exercise } from "@/types";

export default function PlansPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");

  useEffect(() => {
    api.plans.list().then(setPlans).catch(console.error);
    api.exercises.list().then(setExercises).catch(console.error);
  }, []);

  const loadPlan = async (id: number) => {
    const plan = await api.plans.get(id);
    setSelectedPlan(plan);
  };

  const activate = async (id: number) => {
    await api.plans.activate(id);
    const updated = await api.plans.list();
    setPlans(updated);
    if (selectedPlan?.id === id) {
      const plan = await api.plans.get(id);
      setSelectedPlan(plan);
    }
  };

  const deletePlan = async (id: number) => {
    await api.plans.delete(id);
    setPlans((p) => p.filter((pl) => pl.id !== id));
    if (selectedPlan?.id === id) setSelectedPlan(null);
  };

  const createPlan = async () => {
    if (!newPlanName.trim()) return;
    const plan = await api.plans.create({ name: newPlanName.trim(), description: newPlanDesc || undefined, days: [] });
    setPlans((p) => [...p, plan]);
    setShowCreate(false);
    setNewPlanName("");
    setNewPlanDesc("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Trainingspläne</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Neuer Plan
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Plan list */}
        <div className="space-y-2">
          {plans.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Noch keine Pläne</p>
          )}
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-colors hover:border-primary/40 ${selectedPlan?.id === plan.id ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => loadPlan(plan.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">{plan.name}</CardTitle>
                    {plan.isActive && <Badge className="mt-1 text-[10px]">Aktiv</Badge>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                </div>
              </CardHeader>
              {plan.description && (
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Plan detail */}
        <div className="md:col-span-2">
          {!selectedPlan ? (
            <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground text-sm">Plan auswählen</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedPlan.name}</CardTitle>
                    {selectedPlan.description && <CardDescription className="mt-1">{selectedPlan.description}</CardDescription>}
                  </div>
                  <div className="flex gap-2">
                    {!selectedPlan.isActive && (
                      <Button size="sm" variant="outline" onClick={() => activate(selectedPlan.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Aktivieren
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(selectedPlan.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPlan.days || selectedPlan.days.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Keine Trainingstage konfiguriert</p>
                ) : (
                  <div className="space-y-4">
                    {selectedPlan.days.map((day) => (
                      <div key={day.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{WEEKDAYS[day.weekday]}</Badge>
                          <span className="text-sm font-medium">{day.name}</span>
                        </div>
                        <div className="grid gap-1 ml-12">
                          {day.exercises?.map((ex) => (
                            <div key={ex.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                              <span className="text-foreground">{ex.exerciseName}</span>
                              <span className="text-muted-foreground text-xs">{ex.targetSets}×{ex.targetReps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create plan dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Plan erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="z.B. Push/Pull/Legs" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Input value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="Kurze Beschreibung..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button onClick={createPlan} disabled={!newPlanName.trim()}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
