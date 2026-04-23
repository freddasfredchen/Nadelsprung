import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Salad, Scale, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate, todayISO } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Workout, BodyMetrics } from "@/types";

export default function Dashboard() {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ date: string; totalSets: number; totalVolume: number }[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<BodyMetrics | null>(null);
  const [weeklyNutrition, setWeeklyNutrition] = useState<{ date: string; totalCalories: number }[]>([]);
  const today = todayISO();

  useEffect(() => {
    api.workouts.list({ limit: 5 }).then(setRecentWorkouts).catch(console.error);
    api.workouts.weeklyStats().then(setWeeklyStats).catch(console.error);
    api.metrics.latest().then(setLatestMetrics).catch(console.error);
    api.nutrition.logs.weekly().then(setWeeklyNutrition).catch(console.error);
  }, []);

  const totalVolumeWeek = weeklyStats.reduce((s, d) => s + (d.totalVolume ?? 0), 0);
  const workoutDaysWeek = weeklyStats.length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{formatDate(today)}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link to="/workout">
            <Dumbbell className="h-4 w-4 mr-2" />
            Workout starten
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/nutrition">
            <Salad className="h-4 w-4 mr-2" />
            Mahlzeit loggen
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/metrics">
            <Scale className="h-4 w-4 mr-2" />
            Gewicht eintragen
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5" /> Workouts (7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{workoutDaysWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Volumen (7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalVolumeWeek / 1000).toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">t</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" /> Gewicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {latestMetrics?.weightKg ?? "–"}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-3.5 w-3.5" /> Kal. heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(weeklyNutrition.find((d) => d.date === today)?.totalCalories ?? 0)}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Trainingsvolumen – letzte 7 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyStats.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Noch keine Workouts diese Woche</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyStats}>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 47% 13%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number) => [`${(v / 1000).toFixed(1)} t`, "Volumen"]}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <Bar dataKey="totalVolume" fill="hsl(245 60% 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Kalorien – letzte 7 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyNutrition.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Noch keine Mahlzeiten geloggt</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyNutrition}>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 47% 13%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number) => [`${Math.round(v)} kcal`, "Kalorien"]}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <Bar dataKey="totalCalories" fill="hsl(245 60% 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent workouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Letzte Workouts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workout">Alle anzeigen</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Noch kein Workout geloggt</p>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatDate(w.date)}</p>
                    {w.notes && <p className="text-xs text-muted-foreground">{w.notes}</p>}
                  </div>
                  <div className="text-right">
                    {w.durationMinutes && (
                      <span className="text-xs text-muted-foreground">{w.durationMinutes} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
