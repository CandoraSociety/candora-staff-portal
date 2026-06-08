import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Menu, X, Bell, FileText, Users, Briefcase, DollarSign, BarChart3, Settings, Home, ClipboardList, BookOpen, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PathwaysLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks-pending'],
    queryFn: () => base44.entities.CompassTask.filter({ status: 'pending' }, '-created_date', 100),
  });
  
  const taskCount = pendingTasks.length;
  
  const navItems = [
    { path: '/pathways', label: 'Home', icon: Home },
    { path: '/pathways/intake', label: 'Intake', icon: ClipboardList },
    { path: '/pathways/dashboard', label: 'Dashboard', icon: Users },
    { path: '/pathways/master', label: 'Master List', icon: FileText },
    { path: '/pathways/compass', label: 'Compass', icon: Compass, badge: taskCount > 0 ? taskCount : null },
    { path: '/pathways/reports', label: 'Reports', icon: BarChart3 },
    { path: '/pathways/supervisor', label: 'Supervisor', icon: Settings },
    { path: '/pathways/resources', label: 'Resources', icon: BookOpen },
    { path: '/pathways/billing', label: 'Billing', icon: DollarSign },
  ];
  
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-[#1a237e] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" 
                alt="Candora Logo"
                className="h-10 w-10 rounded-full bg-white"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Pathways CM</h1>
                <p className="text-xs text-[#FBB800]">Case Management System</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                      isActive 
                        ? "bg-[#2c3799] text-[#FBB800]" 
                        : "text-white hover:bg-[#2c3799] hover:text-[#FBB800]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-[#FBB800] p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a237e] border-t border-[#2c3799]">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive 
                        ? "bg-[#2c3799] text-[#FBB800]" 
                        : "text-white hover:bg-[#2c3799] hover:text-[#FBB800]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}