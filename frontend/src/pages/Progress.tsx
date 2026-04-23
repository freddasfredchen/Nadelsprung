import { useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatShortDate } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface PR {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  maxWeight: number;
  maxReps: number;
}

interface VolumeData { week: string; totalVolume: number; workoutCount: number; }
interface HeatmapEntry { date: string; count: number; }
interface MetricsData { date: string; weightKg?: number; }

const TOOLTIP_STYLE = { background: "hsl(222 47% 13%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 6, fontSize: 12 };

export default function ProgressPage() {
  const [prs, setPrs] = useState<PR[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<VolumeData[]>([]);
  const [weightHistory, setWeightHistory] = useState<MetricsData[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [period, setPeriod] = useState("90");

  useEffect(() => {
    api.workouts.personalRecords().then(setPrs).catch(console.error);
    api.workouts.heatmap().then(setHeatmap).catch(console.error);
  }, []);

  useEffect(() => {
    api.workouts.volumeHistory(Number(period)).then(setVolumeHistory).catch(console.error);
    api.metrics.list(Number(period)).then((d) => setWeightHistory(d.filter((m) => m.weightKg != null))).catch(console.error);
  }, [period]);

  // Build heatmap grid (last 52 weeks)
  const heatmapMap = new Map(heatmap.map((h) => [h.date, h.count]));
  const today = new Date();
  const heatmapWeeks: { date: string; count: number }[][] = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  // align to Monday
  while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1);
  let cur = new Date(startDate);
  while (cur <= today) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().slice(0, 10);
      week.push({ date: iso, count: heatmapMap.get(iso) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    heatmapWeeks.push(week);
  }

  const groupedPrs = prs.reduce<Record<string, PR[]>>((acc, pr) => {
    (acc[pr.muscleGroup] ??= []).push(pr);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Fortschritt & Statistiken</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 Tage</SelectItem>
            <SelectItem value="90">90 Tage</SelectItem>
            <SelectItem value="365">365 Tage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="volume">
        <TabsList>
          <TabsTrigger value="volume">Volumen</TabsTrigger>
          <TabsTrigger value="weight">Gewicht</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="records">Rekorde</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Trainingsvolumen pro Woche</CardTitle>
            </CardHeader>
            <CardContent>
              {volumeHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">Keine Daten</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={volumeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${(v / 1000).toFixed(1)} t`, "Volumen"]} />
                    <Bar dataKey="totalVolume" fill="hsl(245 60% 64%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Gewichtsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {weightHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">Noch keine Gewichtseinträge</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={weightHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                    <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} kg`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} kg`, "Gewicht"]} />
                    <Line type="monotone" dataKey="weightKg" stroke="hsl(245 60% 64%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Trainingsfrequenz – letztes Jahr</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex gap-1">
                  {heatmapWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.count} Workout(s)`}
                          className="w-3 h-3 rounded-sm"
                          style={{
                            background: day.count === 0
                              ? "hsl(216 34% 17%)"
                              : day.count === 1
                              ? "hsl(245 60% 44%)"
                              : day.count === 2
                              ? "hsl(245 60% 54%)"
                              : "hsl(245 60% 64%)",
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>Weniger</span>
                  {[0, 1, 2, 3].map((v) => (
                    <div key={v} className="w-3 h-3 rounded-sm" style={{ background: v === 0 ? "hsl(216 34% 17%)" : v === 1 ? "hsl(245 60% 44%)" : v === 2 ? "hsl(245 60% 54%)" : "hsl(245 60% 64%)" }} />
                  ))}
                  <span>Mehr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <div className="space-y-4">
            {Object.entries(groupedPrs).map(([group, records]) => (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> {group}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {records.map((pr) => (
                      <div key={pr.exerciseId} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <span className="text-sm">{pr.exerciseName}</span>
                        <div className="flex gap-3 text-sm">
                          <span className="text-muted-foreground">{pr.maxReps} Wdh</span>
                          <span className="font-medium text-primary">{pr.maxWeight} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {prs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Noch keine Trainingsaufzeichnungen
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
