import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Timer, Save, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { todayISO, formatDate, MUSCLE_GROUPS } from "@/lib/utils";
import type { Exercise, WorkoutSet, Workout } from "@/types";

interface ActiveSet {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes: string;
}

interface ExerciseGroup {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
}

export default function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [activeGroups, setActiveGroups] = useState<ExerciseGroup[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Expand/collapse state for past workouts
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, Workout>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(console.error);
    api.workouts.list({ limit: 20 }).then(setPastWorkouts).catch(console.error);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime]);

  useEffect(() => {
    if (restTimer === null) return;
    setRestSeconds(restTimer);
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) { clearInterval(restRef.current!); setRestTimer(null); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restTimer]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!detailCache[id]) {
      setLoadingDetail(id);
      try {
        const detail = await api.workouts.get(id);
        setDetailCache((prev) => ({ ...prev, [id]: detail }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const addExercise = (ex: Exercise) => {
    setActiveGroups((groups) => {
      if (groups.find((g) => g.exerciseId === ex.id)) return groups;
      return [...groups, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: [{ exerciseId: ex.id, exerciseName: ex.name, setNumber: 1, reps: 8, weightKg: 0, notes: "" }],
      }];
    });
  };

  const addSet = (exerciseId: number) => {
    setActiveGroups((groups) =>
      groups.map((g) =>
        g.exerciseId === exerciseId
          ? { ...g, sets: [...g.sets, { ...g.sets[g.sets.length - 1], setNumber: g.sets.length + 1, notes: "" }] }
          : g
      )
    );
  };

  const updateSet = (exerciseId: number, i: number, field: keyof ActiveSet, value: string | number) => {
    setActiveGroups((groups) =>
      groups.map((g) =>
        g.exerciseId === exerciseId
          ? { ...g, sets: g.sets.map((s, si) => (si === i ? { ...s, [field]: value } : s)) }
          : g
      )
    );
  };

  const removeSet = (exerciseId: number, i: number) => {
    setActiveGroups((groups) =>
      groups.map((g) => {
        if (g.exerciseId !== exerciseId) return g;
        const newSets = g.sets.filter((_, si) => si !== i).map((s, si) => ({ ...s, setNumber: si + 1 }));
        return { ...g, sets: newSets };
      }).filter((g) => g.sets.length > 0)
    );
  };

  const removeExercise = (exerciseId: number) =>
    setActiveGroups((groups) => groups.filter((g) => g.exerciseId !== exerciseId));

  const saveWorkout = async () => {
    if (activeGroups.length === 0) return;
    setSaving(true);
    const allSets: WorkoutSet[] = activeGroups.flatMap((g) =>
      g.sets.map((s) => ({ exerciseId: s.exerciseId, setNumber: s.setNumber, reps: s.reps, weightKg: s.weightKg, notes: s.notes || undefined }))
    );
    try {
      await api.workouts.create({
        title: workoutTitle || undefined,
        date: todayISO(),
        durationMinutes: Math.floor(elapsed / 60) || undefined,
        notes: workoutNotes || undefined,
        sets: allSets,
      });
      setSaved(true);
      setActiveGroups([]);
      setWorkoutTitle("");
      setWorkoutNotes("");
      api.workouts.list({ limit: 20 }).then(setPastWorkouts);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exercises.filter((e) => {
    const matchMuscle = filterMuscle === "all" || e.muscleGroup === filterMuscle;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchSearch;
  });

  // Group sets by exercise for the detail view
  const groupSets = (workout: Workout) => {
    const map = new Map<string, { name: string; sets: WorkoutSet[] }>();
    for (const s of workout.sets ?? []) {
      const key = String(s.exerciseId);
      if (!map.has(key)) map.set(key, { name: s.exerciseName ?? "Unbekannt", sets: [] });
      map.get(key)!.sets.push(s);
    }
    return Array.from(map.values());
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout</h1>
          {activeGroups.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              Dauer: <span className="font-mono text-foreground">{formatTime(elapsed)}</span>
            </p>
          )}
        </div>
        {activeGroups.length > 0 && (
          <div className="flex gap-2">
            {restTimer !== null && (
              <div className="flex items-center gap-1 text-sm text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-md">
                <Timer className="h-3.5 w-3.5" />
                {formatTime(restSeconds)}
              </div>
            )}
            <Button onClick={saveWorkout} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saved ? "Gespeichert!" : "Workout speichern"}
            </Button>
          </div>
        )}
      </div>

      {/* Active workout */}
      {activeGroups.length > 0 && (
        <div className="space-y-4">
          {/* Title input at the top */}
          <div className="space-y-2">
            <Label htmlFor="workout-title">Titel</Label>
            <Input
              id="workout-title"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              placeholder='z.B. "Push A – Brust & Schulter"'
            />
          </div>

          {activeGroups.map((group) => (
            <Card key={group.exerciseId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{group.exerciseName}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">{group.muscleGroup}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(group.exerciseId)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground px-1">
                  <span>Satz</span><span>Wdh</span><span>Gewicht (kg)</span><span></span>
                </div>
                {group.sets.map((set, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-sm text-muted-foreground pl-1">{set.setNumber}</span>
                    <Input
                      type="number" min={1} value={set.reps}
                      onChange={(e) => updateSet(group.exerciseId, i, "reps", Number(e.target.value))}
                      className="h-8 text-center"
                    />
                    <Input
                      type="number" min={0} step={0.5} value={set.weightKg}
                      onChange={(e) => updateSet(group.exerciseId, i, "weightKg", Number(e.target.value))}
                      className="h-8 text-center"
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setRestTimer(90); removeSet(group.exerciseId, i); }}>
                        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => removeSet(group.exerciseId, i)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => addSet(group.exerciseId)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Satz hinzufügen
                </Button>
              </CardContent>
            </Card>
          ))}

          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notizen</Label>
            <Input id="workout-notes" value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="Optionale Notizen..." />
          </div>
        </div>
      )}

      {/* Exercise picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Übung hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Übung suchen..." className="pl-8" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterMuscle} onValueChange={setFilterMuscle}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Muskelgruppe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
            {filteredExercises.map((ex) => (
              <button key={ex.id} onClick={() => addExercise(ex)}
                className="text-left px-3 py-2 rounded-md border border-border hover:bg-secondary hover:border-primary/30 transition-colors group">
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past workouts — expandable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Vergangene Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {pastWorkouts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Noch keine Workouts</p>
          ) : (
            <div className="space-y-1">
              {pastWorkouts.map((w) => {
                const isOpen = expandedId === w.id;
                const detail = detailCache[w.id];
                const isLoading = loadingDetail === w.id;
                const groups = detail ? groupSets(detail) : [];

                return (
                  <div key={w.id} className="border border-border rounded-md overflow-hidden">
                    {/* Header row — click to expand */}
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                      onClick={() => toggleExpand(w.id)}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div>
                          <p className="text-sm font-medium">
                            {w.title ?? `Workout vom ${formatDate(w.date)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(w.date)}
                            {w.durationMinutes ? ` · ${w.durationMinutes} min` : ""}
                          </p>
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-border px-4 py-3 space-y-3 bg-secondary/20">
                        {isLoading && (
                          <p className="text-xs text-muted-foreground">Lade Details…</p>
                        )}
                        {!isLoading && groups.length === 0 && (
                          <p className="text-xs text-muted-foreground">Keine Sets aufgezeichnet</p>
                        )}
                        {groups.map((g) => (
                          <div key={g.name}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              {g.name}
                            </p>
                            <div className="space-y-0.5">
                              {g.sets.map((s, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground w-10">Satz {s.setNumber}</span>
                                  <span className="font-medium">{s.reps} Wdh</span>
                                  <span className="text-muted-foreground">×</span>
                                  <span className="font-medium">{s.weightKg} kg</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {detail?.notes && (
                          <p className="text-xs text-muted-foreground border-t border-border pt-2">{detail.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
