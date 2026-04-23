import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Dumbbell, CalendarDays, TrendingUp, Salad, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workout", icon: Dumbbell, label: "Workout" },
  { to: "/plans", icon: CalendarDays, label: "Pläne" },
  { to: "/progress", icon: TrendingUp, label: "Fortschritt" },
  { to: "/nutrition", icon: Salad, label: "Ernährung" },
  { to: "/metrics", icon: Activity, label: "Körper" },
  { to: "/settings", icon: Settings, label: "Einstellungen" },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center px-6 border-b border-border">
          <span className="font-semibold text-foreground tracking-tight">
            <span className="text-primary">Fit</span>Track
          </span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile nav */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-border bg-card">
          <span className="font-semibold">
            <span className="text-primary">Fit</span>Track
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-border bg-card">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
