import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { GraduationCap, LayoutDashboard, BookOpen, Package, Users, BarChart3, Award, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/lms", icon: LayoutDashboard },
  { label: "Module Library", path: "/lms/modules", icon: BookOpen },
  { label: "Programs", path: "/lms/programs", icon: Package },
  { label: "Learners", path: "/lms/learners", icon: Users, disabled: true },
  { label: "Reports", path: "/lms/reports", icon: BarChart3, disabled: true },
  { label: "Certificates", path: "/lms/certificates", icon: Award, disabled: true },
];

export default function LMSLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/lms") return location.pathname === "/lms";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-sidebar text-sidebar-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/lms" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight">Learning</h1>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Management System</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            if (item.disabled) {
              return (
                <div key={item.path} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground/30 cursor-not-allowed">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  <span className="text-[9px] ml-auto bg-sidebar-accent px-1.5 py-0.5 rounded-full">Soon</span>
                </div>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link to="/" className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}