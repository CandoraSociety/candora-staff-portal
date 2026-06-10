import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Image, Mail, Megaphone, Calendar, Globe,
  Search, ClipboardList, BookOpen, Share2, ChevronLeft,
  ChevronRight, LogOut, Inbox
} from 'lucide-react';

const navItems = [
  { path: '/marketing', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/marketing/assets', label: 'Brand Assets', icon: Image },
  { path: '/marketing/email', label: 'Email Campaigns', icon: Mail },
  { path: '/marketing/social', label: 'Social Media', icon: Share2 },
  { path: '/marketing/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/marketing/calendar', label: 'Calendar', icon: Calendar },
  { path: '/marketing/seo', label: 'SEO Tools', icon: Search },
  { path: '/marketing/website', label: 'Website & Domains', icon: Globe },
  { path: '/marketing/resources', label: 'Resources', icon: BookOpen },
  { path: '/marketing/requests', label: 'Requests', icon: Inbox },
];

function MarketingSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['marketing-pending-requests'],
    queryFn: () => base44.entities.MarketingRequest.filter({ status: 'submitted' }),
    refetchInterval: 60000,
  });

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className={cn(
      'h-screen flex flex-col transition-all duration-300 shrink-0',
      'bg-[hsl(330,60%,12%)]',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="border-b border-[hsl(330,50%,18%)] px-3 pt-4 pb-3">
        <Link to="/" className={cn('flex items-center gap-2 group', collapsed ? 'justify-center' : '')}>
          {collapsed ? (
            <img
              src="https://media.base44.com/images/public/6a15e361478575d63a95c265/562a66657_Candoracirclelogo_noanniversary.png"
              alt="Candora"
              className="w-9 h-9 object-contain"
            />
          ) : (
            <img
              src="https://media.base44.com/images/public/6a15e361478575d63a95c265/ded6d4d7a_Candoralogo_noanniversary.png"
              alt="The Candora Society"
              className="h-24 object-contain"
            />
          )}
        </Link>
        <div className={cn('flex items-center mt-2', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <span className="text-[10px] uppercase tracking-widest text-[hsl(330,60%,70%)] font-semibold">
              Marketing &amp; Fundraising
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-[hsl(330,55%,20%)] text-[hsl(330,60%,70%)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          const isRequests = item.path === '/marketing/requests';
          const hasBadge = isRequests && pendingRequests.length > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-[hsl(45,92%,53%)] text-[hsl(330,60%,12%)] font-semibold'
                  : 'text-[hsl(330,60%,80%)] hover:bg-[hsl(330,55%,20%)] hover:text-[hsl(330,92%,90%)]',
                collapsed && 'justify-center'
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4 shrink-0" />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[hsl(330,60%,12%)]" />
                )}
              </div>
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!collapsed && hasBadge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {pendingRequests.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to main app */}
      <div className="px-2 py-2 border-t border-[hsl(330,50%,18%)]">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors font-semibold',
            'text-[hsl(45,92%,53%)] hover:bg-[hsl(330,55%,20%)]',
            collapsed && 'justify-center'
          )}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {!collapsed && (user ? `← ${user.full_name?.split(' ')[0]}'s Home` : '← Home')}
        </Link>
      </div>

      {/* User + sign out */}
      <div className={cn('p-2 border-t border-[hsl(330,50%,18%)] space-y-0.5', collapsed && 'flex flex-col items-center')}>
        {!collapsed && user && (
          <p className="text-[11px] text-[hsl(330,40%,60%)] px-2 mb-1 truncate">{user.full_name || user.email}</p>
        )}
        <button
          onClick={() => base44.auth.logout()}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors',
            'text-[hsl(330,60%,65%)] hover:bg-[hsl(330,55%,20%)] hover:text-[hsl(330,92%,90%)]',
            collapsed && 'justify-center w-auto'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}

export default function MarketingLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MarketingSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}