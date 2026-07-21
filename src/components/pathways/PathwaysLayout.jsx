import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { Menu, X, ChevronLeft, ExternalLink } from 'lucide-react';

const NAV_ITEMS = [
  { label: "Intake",            path: "/pathways/intake" },
  { label: "Master List",       path: "/pathways/master" },
  { label: "My Dashboard",      path: "/pathways/dashboard" },
  { label: "Reports",           path: "/pathways/reports" },
  { label: "Billing",           path: "/pathways/billing" },
  { label: "Childminding",      path: "/pathways/childminding" },
  { label: "Internal Supervisor", path: "/pathways/supervisor" },
  { label: "Resources",         path: "/pathways/resources" },
  { label: "Compass",           path: "/pathways/compass" },
  { label: "Public Portal",     path: "/pathways-intake", external: true },
];

function AppNav({ isSupervisorOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoUrl } = useOrgSettings();
  const [user, setUser] = useState(null);
  const [pendingCompassCount, setPendingCompassCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.CompassTask.filter({ status: "pending" })
      .then(tasks => setPendingCompassCount(tasks.length))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Hide nav on client profile pages
  if (location.pathname.startsWith("/pathways/client/")) return null;

  const visibleNavItems = isSupervisorOnly
    ? NAV_ITEMS.filter(item => item.path === '/pathways/supervisor')
    : NAV_ITEMS;

  const NavButton = ({ item }) => {
    if (item.external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-1"
        >
          {item.label}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    const active = location.pathname === item.path;
    return (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          "px-3 py-1.5 text-sm rounded-md font-medium transition-colors relative",
          active
            ? "text-[hsl(231,64%,16%)] font-semibold"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
        style={active ? { background: "hsl(42,100%,54%)" } : {}}
      >
        {item.label}
        {item.path === "/pathways/compass" && pendingCompassCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {pendingCompassCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="sticky top-0 z-40" style={{ background: "hsl(231,64%,20%)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo + Wordmark — clicks back to home */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group" title={user ? `${user.full_name?.split(' ')[0]}'s Home` : 'Home'}>
          <img
            src={logoUrl}
            alt="Candora logo"
            className="h-9 w-9 object-contain rounded-full group-hover:opacity-80 transition-opacity"
          />
          <span className="hidden md:block" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", fontSize: "15px", letterSpacing: "0.02em" }}>
            <span style={{ fontWeight: 900, color: "hsl(42,100%,54%)" }}>CANDORA</span>
            <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.85)", marginLeft: "4px" }}>Pathways</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
          {visibleNavItems.map((item) => <NavButton key={item.path} item={item} />)}
        </div>

        {/* User Name */}
        {user && (
          <span className="text-xs text-white/50 hidden md:block ml-4 shrink-0">
            {user.full_name || user.email}
          </span>
        )}

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white/80 hover:text-white p-2 rounded-md"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1" style={{ background: "hsl(231,55%,25%)" }}>
          <Link to="/" className="flex items-center gap-1 text-xs text-yellow-300 font-semibold py-1.5 px-2 rounded hover:bg-white/10">
            <ChevronLeft className="w-3.5 h-3.5" /> {user ? `${user.full_name?.split(' ')[0]}'s Home` : 'Home'}
          </Link>
          <div className="border-t border-white/10 my-1" />
          {visibleNavItems.map((item) => <NavButton key={item.path} item={item} />)}
          {user && (
            <p className="text-xs text-white/40 mt-2 pt-2 border-t border-white/10">
              {user.full_name || user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import EAFloatingWidget from "@/components/ed/EAFloatingWidget";
import ModuleGate from "@/components/shared/ModuleGate";

export default function PathwaysLayout() {
  const location = useLocation();

  return (
    <ModuleGate moduleId="pathways" allowAnyOf={['pathways_supervisor']}>
      {({ isSupervisorOnly }) => {
        // Supervisor-only users can only access the Internal Supervisor Portal
        if (isSupervisorOnly && location.pathname !== '/pathways/supervisor') {
          return <Navigate to="/pathways/supervisor" replace />;
        }
        return (
          <div className="min-h-screen bg-slate-50">
            <AppNav isSupervisorOnly={isSupervisorOnly} />
            <main className="w-full">
              <Outlet />
            </main>
            {!isSupervisorOnly && <EAFloatingWidget />}
          </div>
        );
      }}
    </ModuleGate>
  );
}