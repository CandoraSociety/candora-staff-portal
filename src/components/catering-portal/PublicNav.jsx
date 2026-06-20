import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat } from 'lucide-react';

const links = [
  { label: 'Home', path: '/catering-portal' },
  { label: 'Catering Menu', path: '/catering-portal/menu' },
  { label: 'Our Spaces', path: '/catering-portal/spaces' },
  { label: 'Book Now', path: '/catering-portal/book' },
  { label: 'My Booking', path: '/catering-portal/my-booking' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const active = (p) => loc.pathname === p;

  return (
    <nav className="bg-white border-b border-cp-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/catering-portal" className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-cp-primary" />
          <span className="font-heading text-xl font-bold text-cp-primary">Candora Food Services</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-medium transition-colors ${active(l.path) ? 'text-cp-primary font-semibold' : 'text-gray-600 hover:text-cp-primary'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/catering-portal/admin" className="text-xs text-gray-400 hover:text-cp-primary ml-2 border border-gray-200 px-2 py-1 rounded">
            Staff Login
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-cp-border px-4 py-3 space-y-2">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setOpen(false)}
              className={`block py-2 text-sm font-medium ${active(l.path) ? 'text-cp-primary font-semibold' : 'text-gray-600'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/catering-portal/admin" onClick={() => setOpen(false)} className="block py-2 text-xs text-gray-400">
            Staff Login →
          </Link>
        </div>
      )}
    </nav>
  );
}