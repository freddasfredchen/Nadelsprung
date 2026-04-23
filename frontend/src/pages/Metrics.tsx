import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { todayISO, calcBMI, formatShortDate } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { BodyMetrics, Settings } from "@/types";

const TOOLTIP_STYLE = { background: "hsl(222 47% 13%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 6, fontSize: 12 };

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<BodyMetrics | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [period, setPeriod] = useState("90");
  const [form, setForm] = useState({
    date: todayISO(),
    weightKg: "",
    bodyFatPercent: "",
    chestCm: "",
    waistCm: "",
    hipCm: "",
    armCm: "",
  });

  const loadMetrics = () => {
    api.metrics.list(Number(period)).then(setMetrics).catch(console.error);
    api.metrics.latest().then(setLatestMetrics).catch(console.error);
  };

  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  useEffect(() => { loadMetrics(); }, [period]);

  const heightCm = Number(settings?.height_cm ?? 175);
  const bmi = latestMetrics?.weightKg ? calcBMI(latestMetrics.weightKg, heightCm) : null;

  const save = async () => {
    const data: Partial<BodyMetrics> & { date: string } = { date: form.date };
    if (form.weightKg) data.weightKg = Number(form.weightKg);
    if (form.bodyFatPercent) data.bodyFatPercent = Number(form.bodyFatPercent);
    if (form.chestCm) data.chestCm = Number(form.chestCm);
    if (form.waistCm) data.waistCm = Number(form.waistCm);
    if (form.hipCm) data.hipCm = Number(form.hipCm);
    if (form.armCm) data.armCm = Number(form.armCm);
    await api.metrics.create(data as Omit<BodyMetrics, "id">);
    setShowAdd(false);
    setForm({ date: todayISO(), weightKg: "", bodyFatPercent: "", chestCm: "", waistCm: "", hipCm: "", armCm: "" });
    loadMetrics();
  };

  const weightData = metrics.filter((m) => m.weightKg != null);
  const fatData = metrics.filter((m) => m.bodyFatPercent != null);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Körpermaße</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Tage</SelectItem>
              <SelectItem value="90">90 Tage</SelectItem>
              <SelectItem value="365">365 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Eintragen
          </Button>
        </div>
      </div>

      {/* Latest stats */}
      {latestMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gewicht", value: latestMetrics.weightKg ? `${latestMetrics.weightKg} kg` : "–" },
            { label: "BMI", value: bmi ?? "–" },
            { label: "Körperfett", value: latestMetrics.bodyFatPercent ? `${latestMetrics.bodyFatPercent}%` : "–" },
            { label: "Taille", value: latestMetrics.waistCm ? `${latestMetrics.waistCm} cm` : "–" },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weight chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Gewichtsverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          {weightData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Noch keine Gewichtseinträge</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} kg`, "Gewicht"]} />
                <Line type="monotone" dataKey="weightKg" stroke="hsl(245 60% 64%)" strokeWidth={2} dot={{ fill: "hsl(245 60% 64%)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Body fat chart */}
      {fatData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Körperfettverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={fatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Körperfett"]} />
                <Line type="monotone" dataKey="bodyFatPercent" stroke="hsl(245 60% 64%)" strokeWidth={2} dot={{ fill: "hsl(245 60% 64%)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Measurements table */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Messungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="pb-2 text-left font-medium">Datum</th>
                    <th className="pb-2 text-right font-medium">Gewicht</th>
                    <th className="pb-2 text-right font-medium">KF%</th>
                    <th className="pb-2 text-right font-medium">Brust</th>
                    <th className="pb-2 text-right font-medium">Taille</th>
                    <th className="pb-2 text-right font-medium">Hüfte</th>
                    <th className="pb-2 text-right font-medium">Arm</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-2">{m.date}</td>
                      <td className="py-2 text-right">{m.weightKg ? `${m.weightKg} kg` : "–"}</td>
                      <td className="py-2 text-right">{m.bodyFatPercent ? `${m.bodyFatPercent}%` : "–"}</td>
                      <td className="py-2 text-right">{m.chestCm ? `${m.chestCm}` : "–"}</td>
                      <td className="py-2 text-right">{m.waistCm ? `${m.waistCm}` : "–"}</td>
                      <td className="py-2 text-right">{m.hipCm ? `${m.hipCm}` : "–"}</td>
                      <td className="py-2 text-right">{m.armCm ? `${m.armCm}` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Körperwerte eintragen</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            {[
              { key: "weightKg", label: "Gewicht (kg)", placeholder: "70.5" },
              { key: "bodyFatPercent", label: "Körperfett (%)", placeholder: "15" },
              { key: "chestCm", label: "Brust (cm)", placeholder: "100" },
              { key: "waistCm", label: "Taille (cm)", placeholder: "80" },
              { key: "hipCm", label: "Hüfte (cm)", placeholder: "95" },
              { key: "armCm", label: "Arm (cm)", placeholder: "35" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Button>
            <Button onClick={save}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
