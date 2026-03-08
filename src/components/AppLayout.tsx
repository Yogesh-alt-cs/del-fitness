import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Apple, Play, Bot, LayoutDashboard, User, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/nutrition", label: "Nutrition", icon: Apple },
  { path: "/workouts", label: "Workouts", icon: Dumbbell },
  { path: "/videos", label: "Videos", icon: Play },
  { path: "/coach", label: "Coach", icon: Bot },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 gap-2 fixed h-screen">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Dumbbell className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl text-foreground">DELFITNESS</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  active
                    ? "bg-primary/10 text-primary glow-border border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-display text-xl text-foreground">DELFITNESS</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-16"
        >
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all text-base font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
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

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
