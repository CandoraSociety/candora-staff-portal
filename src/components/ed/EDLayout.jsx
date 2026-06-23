import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { LayoutDashboard, FolderKanban, Target, BarChart2, DollarSign, Network, StickyNote, ChevronLeft, LayoutGrid, Menu, X, ListChecks, FileText } from "lucide-react";
import EDWidgetSettings from "./EDWidgetSettings";
import EAFloatingWidget from "./EAFloatingWidget";

const NAV = [
  { label: "Dashboard", path: "/ed", icon: LayoutDashboard },
  { label: "Projects", path: "/ed/projects", icon: FolderKanban },
  { label: "OPSP", path: "/ed/opsp", icon: Target },
  { label: "KPIs", path: "/ed/kpis", icon: BarChart2 },
  { label: "Budgets", path: "/ed/budgets", icon: DollarSign },
  { label: "Org Chart", path: "/ed/org", icon: Network },
  { label: "Notes", path: "/ed/notes", icon: StickyNote },
  { label: "Agenda Maker", path: "/ed/agendas", icon: ListChecks },
  { label: "Board Report", path: "/ed/board-report", icon: FileText },
];

export default function EDLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWidgets, setShowWidgets] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const renderSidebar = () => showWidgets ? (
    <EDWidgetSettings onClose={() => setShowWidgets(false)} />
  ) : (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: "hsl(230,50%,16%)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(45,92%,53%)" }}>
          <span className="text-xs font-bold" style={{ color: "hsl(230,60%,10%)" }}>EA</span>
        </div>
        <div>
          <p className="text-xs font-bold leading-none" style={{ color: "hsl(45,92%,53%)" }}>Executive</p>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: "hsl(230,30%,65%)" }}>Assistant Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/ed"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "font-semibold" : "hover:opacity-80"
              }`
            }
            style={({ isActive }) => isActive
              ? { background: "hsl(45,92%,53%)", color: "hsl(230,60%,10%)" }
              : { color: "hsl(45,60%,88%)" }
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setShowWidgets(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80 mt-2"
          style={{ color: "hsl(45,60%,88%)" }}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Dashboard Widgets</span>
        </button>
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full hover:opacity-70 transition-colors"
          style={{ color: "hsl(230,30%,60%)" }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-200 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(230,70%,10%)" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 rounded-md hover:opacity-70 transition-opacity"
          style={{ color: "hsl(45,60%,88%)" }}
        >
          <X className="w-4 h-4" />
        </button>
        {renderSidebar()}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col" style={{ background: "hsl(230,70%,10%)" }}>
        {renderSidebar()}
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b md:hidden" style={{ background: "hsl(230,70%,10%)" }}>
          <button type="button" onClick={() => setMobileOpen(prev => !prev)} className="z-10 p-1" style={{ color: "hsl(45,92%,53%)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold" style={{ color: "hsl(45,92%,53%)" }}>Executive Assistant Portal</span>
        </div>
        <Outlet />
      </main>
      <EAFloatingWidget />
    </div>
  );
}