import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png';

const links = [
  { label: 'Home',          path: '/catering-portal' },
  { label: 'Our Story',     path: '/catering-portal/our-story' },
  { label: 'Catering Menu', path: '/catering-portal/menu' },
  { label: 'Our Spaces',    path: '/catering-portal/spaces' },
  { label: 'Book Now',      path: '/catering-portal/book' },
  { label: 'My Booking',    path: '/catering-portal/my-booking' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const active = (p) => loc.pathname === p;

  return (
    <nav className="bg-white border-b border-cp-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/catering-portal" className="flex items-center gap-3">
          <img src={LOGO} alt="Candora Events and Catering Services" className="h-10 w-auto object-contain" />
          <span className="font-heading text-base font-bold text-cp-text hidden sm:block leading-tight">
            Candora Events<br />
            <span className="text-cp-primary text-xs font-semibold tracking-wide">& Catering Services</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-medium transition-colors ${active(l.path) ? 'text-cp-primary font-semibold border-b-2 border-cp-primary pb-0.5' : 'text-gray-600 hover:text-cp-primary'}`}
            >
              {l.label}
            </Link>
          ))}
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
        </div>
      )}
    </nav>
  );
}