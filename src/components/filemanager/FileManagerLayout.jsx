import React, { useState, createContext, useContext } from 'react';
import FloatingNoteButton from '@/components/notes/FloatingNoteButton';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import ModuleGate from '@/components/shared/ModuleGate';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { cn } from '@/lib/utils';
import { 
  Menu, X, ChevronLeft, Home, FolderOpen, Globe, User, Shield, 
  DollarSign, Building2, Search, Upload, PackagePlus, FolderHeart, 
  LayoutDashboard, StickyNote, CheckSquare, Pencil, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Context so FileBrowser and other pages can read granted file access levels
export const FilePermissionsContext = createContext({ grantedFileLevels: [] });

// Base nav items — file access items are added dynamically based on permissions
const BASE_NAV_ITEMS = [
  { path: "/filemanager",                      label: "Dashboard",     icon: Home,          accessLevel: null },
  { path: "/filemanager/files",                label: "All Files",     icon: FolderOpen,    accessLevel: null },
  { path: "/filemanager/files?access=personal",  label: "My Files (Private)", icon: User,    accessLevel: "personal" }, // user's private SharePoint folder

  { path: "/filemanager/files?access=finance",   label: "Finance Files",  icon: DollarSign, accessLevel: "finance" },
  { path: "/filemanager/files?access=corporate", label: "Corporate Files", icon: Building2, accessLevel: "corporate" },
  { path: "/filemanager/search",               label: "Search",        icon: Search,        accessLevel: null },
  { path: "/filemanager/upload",               label: "Upload",        icon: Upload,        accessLevel: null },
  { path: "/filemanager/bulk",                 label: "Bulk Import",   icon: PackagePlus,   accessLevel: null },
  { path: "/filemanager/collections",          label: "Collections",   icon: FolderHeart,   accessLevel: null },
  { path: "/filemanager/workspace",            label: "My Workspace",  icon: LayoutDashboard, accessLevel: null },
  { path: "/filemanager/notes",                label: "Notes",         icon: StickyNote,    accessLevel: null },
  { path: "/filemanager/editor",               label: "File Editor",   icon: Pencil,        accessLevel: null },
];

function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoUrl } = useOrgSettings();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch file-level access permissions via the server-side access gate
  // This also populates accessible SharePoint folders for the user
  const { data: accessData } = useQuery({
    queryKey: ['accessible-files', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await base44.functions.invoke('getAccessibleFiles', {});
      return res.data;
    },
  });

  const grantedFileLevels = accessData?.granted_file_levels || [];

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  const isAdmin = accessData?.user?.is_admin ?? (user?.role === 'admin');

  const visibleItems = BASE_NAV_ITEMS.filter(item => {
    if (!item.accessLevel) return true; // always visible
    if (item.accessLevel === 'personal') return true; // everyone sees My Files (content is filtered server-side)
    // Restricted access levels: admin or explicitly granted
    return isAdmin || grantedFileLevels.includes(item.accessLevel);
  });

  const NavButton = ({ item }) => {
    const itemPath = item.path.split('?')[0];
    const itemQuery = item.path.includes('?') ? item.path.split('?')[1] : null;
    const isActive = item.search 
      ? location.pathname === itemPath && location.search.includes('access=')
      : location.pathname === itemPath && (itemQuery ? location.search === `?${itemQuery}` : true);
    
    const Icon = item.icon;
    
    return (
      <Link
        to={item.path}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64",
        "hidden lg:block"
      )}>
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {visibleItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
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
        <aside className="fixed top-0 left-0 h-full w-64 bg-sidebar lg:hidden z-50">
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
            {visibleItems.map((item) => (
              <NavButton key={item.path} item={item} />
            ))}
          </nav>
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
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
        {/* Mobile Header */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b bg-background">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png"
              alt="Candora"
              className="h-8 w-8 object-contain rounded-full"
            />
            <span className="font-display font-bold text-primary text-sm">CANDORA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-7xl mx-auto">
          <FilePermissionsContext.Provider value={{ grantedFileLevels, isAdmin }}>
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