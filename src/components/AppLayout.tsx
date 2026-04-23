import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Apple, Play, Bot, LayoutDashboard, User, Menu, X, TrendingUp, Dumbbell } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/delfitness-logo.png";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/nutrition", label: "Nutrition", icon: Apple },
  { path: "/workouts", label: "Workouts", icon: Dumbbell },
  { path: "/videos", label: "Videos", icon: Play },
  { path: "/progress", label: "Progress", icon: TrendingUp },
  { path: "/coach", label: "Coach", icon: Bot },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border glass-subtle p-6 gap-2 fixed h-screen z-30 rounded-none">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logo} alt="DelFitness logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-2xl text-foreground">DELFITNESS</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium glass-press ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-subtle border-b border-border px-4 py-3 flex items-center justify-between rounded-none">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="DelFitness logo" className="h-6 w-6 object-contain" />
          <span className="font-display text-xl text-foreground">DELFITNESS</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground glass-press">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-16"
        >
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 text-base font-medium glass-press ${
                    active ? "bg-primary/10 text-primary border border-primary/25" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}

      {/* Mobile bottom nav — strong glass floating bar */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-strong rounded-2xl flex justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] glass-press transition-colors duration-200 ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {children}
      </main>
    </div>
  );
}
