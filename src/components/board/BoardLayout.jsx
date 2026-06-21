import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Calendar, FolderOpen, Users, BookOpen, Target, MessageSquare, ChevronLeft, ChevronRight, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import LogoutConfirmationDialog from "@/components/auth/LogoutConfirmationDialog";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/board", label: "Dashboard", icon: LayoutDashboard },
  { path: "/board/meetings", label: "Meetings", icon: Calendar },
  { path: "/board/documents", label: "Documents", icon: FolderOpen },
  { path: "/board/members", label: "Board Members", icon: Users },
  { path: "/board/onboarding", label: "Onboarding", icon: BookOpen },
  { path: "/board/strategic-plan", label: "Strategic Plan", icon: Target },
  { path: "/board/assistant", label: "Board Assistant", icon: MessageSquare },
];

export default function BoardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();

  const handleLogout = () => base44.auth.logout("/login");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div>
            <h1 className="font-display text-base font-bold text-white leading-tight">Candora Board</h1>
            <p className="text-xs text-white/50 mt-0.5">Governance Platform</p>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">CB</div>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== "/board" && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4 space-y-1 border-t border-white/10 pt-2 mt-2">
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-xs transition-all">
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform duration-200 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <SidebarContent />
      </aside>
      <aside className={cn("hidden lg:flex flex-col bg-sidebar transition-all duration-200 shrink-0", collapsed ? "w-16" : "w-60")}>
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="text-foreground"><Menu size={20} /></button>
          <h1 className="font-display font-bold text-foreground">Candora Board</h1>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
      <LogoutConfirmationDialog open={showLogout} onOpenChange={setShowLogout} onConfirm={handleLogout} />
    </div>
  );
}