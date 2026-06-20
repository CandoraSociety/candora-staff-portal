import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, DollarSign, CheckCircle } from 'lucide-react';

export default function OurSpaces() {
  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['public-spaces'],
    queryFn: () => base44.entities.SpaceConfig.filter({ is_active: true }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-cp-text mb-3">Our Spaces</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Our in-house spaces are designed for intimate gatherings of up to 30 guests — perfect for meetings, private dinners, celebrations, and more.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-10 text-sm text-amber-800 text-center font-medium">
        ✦ All in-house spaces accommodate a maximum of 30 guests for the best event experience.
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="bg-cp-muted rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {spaces.map(space => (
            <div key={space.id} className="bg-white rounded-2xl border border-cp-border shadow-sm p-8 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-heading text-2xl font-bold text-cp-text mb-1">{space.display_name}</h2>
                  <p className="text-gray-500 mb-4 leading-relaxed">{space.description}</p>

                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Users className="w-4 h-4 text-cp-primary" />
                      Up to {space.max_capacity} guests
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <DollarSign className="w-4 h-4 text-cp-primary" />
                      ${space.hourly_rate}/hour
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(space.amenities || []).map(a => (
                      <span key={a} className="flex items-center gap-1 text-xs bg-cp-muted text-gray-600 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 text-cp-primary" /> {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(space.allowed_event_types || []).map(t => (
                      <span key={t} className="text-xs bg-cp-primary/10 text-cp-primary px-2 py-0.5 rounded-full capitalize">{t.replace(/_/g,' ')}</span>
                    ))}
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="bg-cp-muted rounded-xl px-5 py-3 text-center inline-block">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Starting from</p>
                    <p className="font-heading text-2xl font-bold text-cp-primary">${space.hourly_rate}<span className="text-sm font-normal text-gray-400">/hr</span></p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center bg-cp-primary rounded-2xl p-10 text-white">
        <h3 className="font-heading text-2xl font-bold mb-3">Book One of Our Spaces</h3>
        <p className="text-white/70 mb-6">Available with full catering, bar service, and equipment rentals.</p>
        <Link to="/catering-portal/book" className="bg-white text-cp-primary font-bold px-8 py-3 rounded-full hover:bg-cp-muted transition-colors">
          Start Your Booking
        </Link>
      </div>
    </div>
  );
}