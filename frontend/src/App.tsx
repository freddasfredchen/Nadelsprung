import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Workout from "@/pages/Workout";
import Plans from "@/pages/Plans";
import Progress from "@/pages/Progress";
import Nutrition from "@/pages/Nutrition";
import Metrics from "@/pages/Metrics";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
