import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Truck, Building2, Wine, CheckCircle, CalendarCheck, Star, ArrowRight } from 'lucide-react';

export default function CateringHome() {
  const { data: featured = [] } = useQuery({
    queryKey: ['catering-menu-featured'],
    queryFn: () => base44.entities.CateringMenuItem.filter({ is_active: true }, '-created_date', 4),
  });

  return (
    <div className="text-cp-text">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(230,70%,12%)] via-[hsl(230,65%,16%)] to-[hsl(230,60%,20%)] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Prominent Logo */}
          <div className="mb-8">
            <img
              src="https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png"
              alt="Candora Events and Catering Services"
              className="h-28 md:h-36 w-auto object-contain mx-auto drop-shadow-xl"
            />
          </div>
          {/* Baby-blue spoon-colour accent line */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16 bg-[hsl(199,70%,55%)]" />
            <span className="text-[hsl(199,70%,65%)] text-xs font-bold uppercase tracking-widest">Candora Events and Catering Services</span>
            <div className="h-px w-16 bg-[hsl(199,70%,55%)]" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Full-Service Catering<br />for Every Occasion
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Whether we come to your venue or you host in one of our intimate spaces, we deliver exceptional food and seamless event experiences — rooted in community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/catering-portal/book" className="bg-[hsl(45,92%,53%)] text-[hsl(230,60%,10%)] font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity text-lg shadow-lg">
              Book an Event
            </Link>
            <Link to="/catering-portal/menu" className="bg-white/10 text-white border border-white/25 font-semibold px-8 py-3 rounded-full hover:bg-white/20 transition-colors text-lg">
              View Our Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-cp-bg">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-3 text-cp-text">What We Offer</h2>
          <p className="text-center text-gray-500 mb-12">Three ways we can make your event exceptional</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'External Catering and Events Services', desc: 'We come to you. Our team delivers, sets up, and serves at your chosen venue — no matter the size or style.', color: 'text-cp-accent' },
              { icon: Building2, title: 'In-House Events', desc: 'Book one of our four intimate spaces (up to 30 guests) with full catering, tables, and ambiance included.', color: 'text-cp-primary' },
              { icon: Wine, title: 'Bar & Beverage', desc: 'Add a full bar service to any event — open bar, cash bar, or custom beverage packages tailored to your needs.', color: 'text-purple-500' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm border border-cp-border text-center hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-cp-muted mb-5 ${color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-cp-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 text-cp-text">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: CalendarCheck, title: 'Submit Your Request', desc: 'Fill out our simple booking form with your event details, preferences, and menu selections.' },
              { step: 2, icon: CheckCircle, title: 'We Confirm & Plan', desc: 'Our team reviews your request and reaches out to finalize details and confirm your booking.' },
              { step: 3, icon: Star, title: 'Enjoy Your Event', desc: 'Sit back and enjoy — we handle everything from setup to service to teardown.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cp-primary text-white text-2xl font-bold font-heading mb-5">
                  {step}
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      {featured.length > 0 && (
        <section className="py-20 px-4 bg-cp-bg">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl font-bold text-cp-text">Menu Highlights</h2>
                <p className="text-gray-500 mt-1">A taste of what we bring to every event</p>
              </div>
              <Link to="/catering-portal/menu" className="flex items-center gap-1 text-cp-primary font-semibold text-sm hover:underline">
                Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-5 border border-cp-border shadow-sm">
                  <span className="text-xs bg-cp-muted text-gray-500 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                  <h3 className="font-heading font-bold mt-2 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                  <p className="text-cp-primary font-semibold text-sm mt-2">
                    {item.price_per_person ? `$${item.price_per_person}/person` : `$${item.price_per_unit}/unit`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-cp-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">Ready to Plan Your Event?</h2>
          <p className="text-white/70 mb-8">Let's create something memorable together. Start your booking today.</p>
          <Link to="/catering-portal/book" className="bg-[hsl(45,92%,53%)] text-[hsl(230,60%,10%)] font-bold px-10 py-4 rounded-full hover:opacity-90 transition-opacity text-lg inline-block shadow-md">
            Start Booking
          </Link>
        </div>
      </section>
    </div>
  );
}