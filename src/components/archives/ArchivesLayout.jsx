import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import EAFloatingWidget from "@/components/ed/EAFloatingWidget";
import { Archive, LayoutDashboard, GitBranch, BookOpen, Users, Lightbulb, FolderOpen, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/archives", icon: LayoutDashboard },
  { name: "Timeline", href: "/archives/timeline", icon: GitBranch },
  { name: "Full Chronicle", href: "/archives/timeline/chronicle", icon: BookOpen },
  { name: "Bios", href: "/archives/bios", icon: Users },
  { name: "Stories", href: "/archives/stories", icon: Lightbulb },
  { name: "Documents", href: "/archives/documents", icon: FolderOpen },
];

export default function ArchivesLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-sidebar">
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/archives" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Archive className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground">Candora Archives</h1>
              <p className="text-xs text-sidebar-foreground/70">Preserving Our History</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = item.href === "/archives"
                ? location.pathname === "/archives"
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button className="md:hidden text-sidebar-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-sidebar-border bg-sidebar">
            <nav className="flex flex-col gap-1 p-4">
              {navigation.map((item) => {
                const isActive = item.href === "/archives"
                  ? location.pathname === "/archives"
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto p-6">
        <Outlet />
      </main>
      <EAFloatingWidget />
    </div>
  );
}