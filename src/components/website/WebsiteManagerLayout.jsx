import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Globe2, LayoutDashboard, CalendarDays, FileText, Newspaper, Settings, Radio, Menu, X, ArrowLeft, Search, Megaphone, MapPin, BookOpen, Users, HeartHandshake, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Candora360Wordmark from "@/components/brand/Candora360Wordmark";
import WebsiteAccessGate from "@/components/website/WebsiteAccessGate";

const NAV_ITEMS = [
  { label: "Overview", path: "/website", icon: LayoutDashboard },
  { label: "Events & Programs", path: "/website/events", icon: CalendarDays },
  { label: "Programs & Workshops", path: "/website/programs", icon: BookOpen },
  { label: "Registrations", path: "/website/registrations", icon: Users },
  { label: "Volunteers", path: "/website/volunteers", icon: HeartHandshake },
  { label: "Documents & Resources", path: "/website/library", icon: FolderOpen },
  { label: "Page Content", path: "/website/pages", icon: FileText },
  { label: "News & Updates", path: "/website/news", icon: Newspaper },
  { label: "Search & AI visibility", path: "/website/seo", icon: Search },
  { label: "Ads & promotion", path: "/website/ads", icon: Megaphone },
  { label: "Online presence", path: "/website/presence", icon: MapPin },
  { label: "Site Settings", path: "/website/settings", icon: Settings },
  { label: "Website Feed", path: "/website/feed", icon: Radio },
];

export default function WebsiteManagerLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/website") return location.pathname === "/website";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-sidebar text-sidebar-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-[264px] bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/website" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Globe2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base leading-tight">Website Studio</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 leading-tight mt-0.5">
                Candora public site
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <Candora360Wordmark size="xs" staff />
          <Link
            to="/"
            className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to staff portal
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 overflow-y-auto">
        <WebsiteAccessGate>
          <Outlet />
        </WebsiteAccessGate>
      </main>
    </div>
  );
}