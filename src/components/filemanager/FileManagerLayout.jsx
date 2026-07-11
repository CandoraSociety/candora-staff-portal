import React, { useState, createContext, useContext } from 'react';
import FloatingNoteButton from '@/components/notes/FloatingNoteButton';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import ModuleGate from '@/components/shared/ModuleGate';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { PORTAL_MODULES } from '@/lib/tierPermissionPresets';
import { cn } from '@/lib/utils';
import { 
  Menu, X, ChevronLeft, Home, FolderOpen, User, 
  Search, Upload, PackagePlus, FolderHeart, 
  LayoutDashboard, StickyNote, Pencil, LogOut, CloudUpload, Folder 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Context so FileBrowser and other pages can read granted file access levels
export const FilePermissionsContext = createContext({ grantedFileLevels: [] });

// Tools section — always visible
const TOOL_ITEMS = [
  { path: "/filemanager/search",      label: "Search",        icon: Search },
  { path: "/filemanager/bulk",       label: "Bulk Import",   icon: PackagePlus },
  { path: "/filemanager/collections",label: "Collections",   icon: FolderHeart },
  { path: "/filemanager/workspace",  label: "My Workspace",  icon: LayoutDashboard },
  { path: "/filemanager/notes",      label: "Notes",         icon: StickyNote },
  { path: "/filemanager/editor",     label: "File Editor",   icon: Pencil },
];

function AppNav() {
  const location = useLocation();
  const { logoUrl } = useOrgSettings();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch file-level access permissions via the server-side access gate
  const { data: accessData } = useQuery({
    queryKey: ['accessible-files', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await base44.functions.invoke('getAccessibleFiles', {});
      return res.data;
    },
  });

  const grantedFileLevels = accessData?.granted_file_levels || [];
  const accessibleModules = accessData?.granted_modules || [];
  const isAdmin = accessData?.user?.is_admin ?? (user?.role === 'admin');

  // Build portal file tabs dynamically from the user's accessible modules
  const portalTabs = PORTAL_MODULES
    .filter(mod => mod.id !== 'filemanager' && (isAdmin || accessibleModules.includes(mod.id)))
    .map(mod => ({
      path: `/filemanager/files?portal=${mod.id}`,
      label: `${mod.label} Files`,
      icon: Folder,
      portalId: mod.id,
    }));

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  // --- Active state detection ---
  const urlParams = new URLSearchParams(location.search);
  const currentAccess = urlParams.get('access');
  const currentPortal = urlParams.get('portal');

  function isItemActive(item) {
    const itemPath = item.path.split('?')[0];
    if (location.pathname !== itemPath) return false;
    if (item.portalId) return currentPortal === item.portalId;
    if (item.accessFilter) return currentAccess === item.accessFilter;
    // "All Files" — on /filemanager/files with no query params
    if (item.label === 'All Files') return !currentAccess && !currentPortal;
    // Other tool pages — match path only
    return !location.search || location.search === '';
  }

  const NavButton = ({ item }) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => setMenuOpen(false)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  // Nav section label (hidden when collapsed)
  const SectionLabel = ({ children }) => (
    !collapsed && <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{children}</p>
  );

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64",
        "hidden lg:block"
      )}>
        <div className="h-14 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoUrl} alt="Candora" className="h-8 w-8 object-contain rounded-full" />
            {!collapsed && (
              <span className="font-display font-bold text-sidebar-primary text-sm">CANDORA</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Upload — primary action */}
          <Link
            to="/filemanager/upload"
            onClick={() => setMenuOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md font-bold transition-colors mb-2",
              location.pathname === '/filemanager/upload'
                ? "bg-primary text-primary-foreground"
                : "bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/25"
            )}
          >
            <CloudUpload className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Upload Files</span>}
          </Link>

          {/* Dashboard */}
          <NavButton item={{ path: '/filemanager', label: 'Dashboard', icon: Home }} />

          <SectionLabel>Browse Files</SectionLabel>
          <NavButton item={{ path: '/filemanager/files', label: 'All Files', icon: FolderOpen }} />
          <NavButton item={{ path: '/filemanager/files?access=personal', label: 'My Files', icon: User, accessFilter: 'personal' }} />

          {/* Portal-specific file tabs */}
          {portalTabs.length > 0 && (
            <>
              <SectionLabel>Portal Files</SectionLabel>
              {portalTabs.map(item => <NavButton key={item.path} item={item} />)}
            </>
          )}

          <SectionLabel>Tools</SectionLabel>
          {TOOL_ITEMS.map(item => <NavButton key={item.path} item={item} />)}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border bg-sidebar">
          {user && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-sidebar-primary">
                  {user.full_name?.charAt(0) || user.email.charAt(0)}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
                </div>
              )}
              {!collapsed && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {menuOpen && (
        <aside className="fixed top-0 left-0 h-full w-64 bg-sidebar lg:hidden z-50 overflow-y-auto">
          <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoUrl} alt="Candora" className="h-8 w-8 object-contain rounded-full" />
              <span className="font-display font-bold text-sidebar-primary text-sm">CANDORA</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
              <X className="h-5 w-5 text-sidebar-foreground" />
            </Button>
          </div>
          <nav className="p-3 space-y-1">
            <Link
              to="/filemanager/upload"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md font-bold transition-colors mb-2",
                location.pathname === '/filemanager/upload'
                  ? "bg-primary text-primary-foreground"
                  : "bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/25"
              )}
            >
              <CloudUpload className="h-4 w-4 shrink-0" />
              <span>Upload Files</span>
            </Link>
            <NavButton item={{ path: '/filemanager', label: 'Dashboard', icon: Home }} />
            <SectionLabel>Browse Files</SectionLabel>
            <NavButton item={{ path: '/filemanager/files', label: 'All Files', icon: FolderOpen }} />
            <NavButton item={{ path: '/filemanager/files?access=personal', label: 'My Files', icon: User, accessFilter: 'personal' }} />
            {portalTabs.length > 0 && (
              <>
                <SectionLabel>Portal Files</SectionLabel>
                {portalTabs.map(item => <NavButton key={item.path} item={item} />)}
              </>
            )}
            <SectionLabel>Tools</SectionLabel>
            {TOOL_ITEMS.map(item => <NavButton key={item.path} item={item} />)}
          </nav>
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{user.full_name || user.email}</p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-sidebar-foreground/50 hover:text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[70px]" : "lg:ml-64"
      )}>
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b bg-background">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="Candora" className="h-8 w-8 object-contain rounded-full" />
            <span className="font-display font-bold text-primary text-sm">CANDORA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <FilePermissionsContext.Provider value={{ grantedFileLevels, isAdmin, accessibleModules }}>
            <Outlet />
          </FilePermissionsContext.Provider>
        </main>
      </div>
      <FloatingNoteButton />
      <EAFloatingWidget />
    </>
  );
}

function FileManagerLayout() {
  return (
    <ModuleGate moduleId="filemanager">
      <AppNav />
    </ModuleGate>
  );
}

export default FileManagerLayout;