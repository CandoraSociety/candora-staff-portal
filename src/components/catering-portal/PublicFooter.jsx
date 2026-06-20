import React from 'react';
import { Link } from 'react-router-dom';

const LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png';

export default function PublicFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <img src={LOGO} alt="Candora Events and Catering Services" className="h-12 w-auto object-contain mb-3" />
          <p className="text-sm text-sidebar-foreground/60 font-semibold">Candora Events and Catering Services</p>
          <p className="text-sm text-sidebar-foreground/40 mt-1">Full-service catering and event spaces — rooted in community.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-3">Navigation</p>
          <div className="space-y-1">
            {[
              ['Home',           '/catering-portal'],
              ['Our Story',      '/catering-portal/our-story'],
              ['Catering Menu',  '/catering-portal/menu'],
              ['Our Spaces',     '/catering-portal/spaces'],
              ['Book an Event',  '/catering-portal/book'],
              ['My Booking',     '/catering-portal/my-booking'],
            ].map(([l, p]) => (
              <Link key={p} to={p} className="block text-sm text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-3">Contact</p>
          <p className="text-sm text-sidebar-foreground/50">For inquiries, use our online booking form or reach our team directly through the booking wizard.</p>
          <div className="mt-4">
            <Link to="/catering-portal/book" className="inline-block bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
              Book an Event
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/30">
        © {new Date().getFullYear()} Candora Events and Catering Services · A Candora Society Social Enterprise
      </div>
    </footer>
  );
}