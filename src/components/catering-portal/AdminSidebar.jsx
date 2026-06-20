import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CalendarDays, UtensilsCrossed, Package, BarChart3, DollarSign, ChefHat, ExternalLink } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/catering-portal/admin' },
  { label: 'Bookings', icon: ClipboardList, path: '/catering-portal/admin/bookings' },
  { label: 'Calendar', icon: CalendarDays, path: '/catering-portal/admin/calendar' },
  { label: 'Catering Menus', icon: UtensilsCrossed, path: '/catering-portal/admin/catering' },
  { label: 'Equipment', icon: Package, path: '/catering-portal/admin/equipment' },
  { label: 'Analytics', icon: BarChart3, path: '/catering-portal/admin/analytics' },
  { label: 'Financials', icon: DollarSign, path: '/catering-portal/admin/financials' },
];

export default function AdminSidebar({ onClose }) {
  const loc = useLocation();
  const active = (p) => p === '/catering-portal/admin' ? loc.pathname === p : loc.pathname.startsWith(p);

  return (
    <div className="flex flex-col h-full bg-cp-admin-sidebar w-64">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-cp-accent" />
          <span className="font-heading text-base font-bold text-white">Candora Admin</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Food Services Portal</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active(path)
                ? 'bg-cp-primary text-white'
                : 'text-gray-300 hover:bg-cp-admin-sidebar-accent hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/catering-portal"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-cp-admin-sidebar-accent"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Public Site
        </Link>
      </div>
    </div>
  );
}