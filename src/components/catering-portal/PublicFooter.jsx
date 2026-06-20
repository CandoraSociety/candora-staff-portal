import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-cp-admin-sidebar text-cp-sidebar-fg mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-5 h-5 text-cp-accent" />
            <span className="font-heading text-lg font-bold text-white">Candora Food Services</span>
          </div>
          <p className="text-sm text-gray-400">Full-service catering and event spaces for every occasion.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Navigation</p>
          <div className="space-y-1">
            {[['Home','/catering-portal'],['Catering Menu','/catering-portal/menu'],['Our Spaces','/catering-portal/spaces'],['Book an Event','/catering-portal/book'],['My Booking','/catering-portal/my-booking']].map(([l,p]) => (
              <Link key={p} to={p} className="block text-sm text-gray-400 hover:text-white transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Contact</p>
          <p className="text-sm text-gray-400">For inquiries, book online or reach out to our team directly through the booking form.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Candora Food Services. All rights reserved.
      </div>
    </footer>
  );
}