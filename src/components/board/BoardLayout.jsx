import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Calendar, FolderOpen, Users, BookOpen, Target, MessageSquare, ChevronLeft, ChevronRight, Menu, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoutConfirmationDialog from "@/components/auth/LogoutConfirmationDialog";
import { base44 } from "@/api/base44Client";
import { useOrgSettings } from "@/lib/useOrgSettings";

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
  const { logoUrl } = useOrgSettings();

  const handleLogout = () => base44.auth.logout("/login");

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo / Branding */}
      <div className={cn("flex items-center gap-3 px-3 py-4 border-b border-sidebar-border", collapsed ? "justify-center" : "")}>
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoUrl} alt="Candora" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-none text-sidebar-primary">CANDORA</p>
            <p className="text-xs mt-0.5 truncate text-sidebar-foreground/60">Board Governance</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("ml-auto p-1 rounded transition-colors hover:bg-white/10 hidden lg:flex", collapsed && "ml-0")}
          style={{ color: "hsl(var(--sidebar-foreground)/0.5)" }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Back to Dashboard */}
      <Link
        to="/"
        className={cn("flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/10 border-b border-sidebar-border", collapsed ? "justify-center" : "")}
        style={{ color: "hsl(var(--sidebar-foreground)/0.7)" }}
      >
        <Home className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="text-xs">Back to Dashboard</span>}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== "/board" && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={cn("flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors", collapsed && "justify-center")}
              style={active
                ? { backgroundColor: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" }
                : { color: "hsl(var(--sidebar-foreground)/0.75)" }
              }
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "hsl(var(--sidebar-accent))"; e.currentTarget.style.color = "hsl(var(--sidebar-accent-foreground))"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = "hsl(var(--sidebar-foreground)/0.75)"; } }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setShowLogout(true)}
          className={cn("flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors hover:bg-white/10", collapsed && "justify-center")}
          style={{ color: "hsl(var(--sidebar-foreground)/0.6)" }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:flex flex-col transition-all duration-200 shrink-0", collapsed ? "w-16" : "w-60")}>
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