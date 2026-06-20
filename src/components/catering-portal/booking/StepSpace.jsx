import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, DollarSign, CheckCircle } from 'lucide-react';

export default function StepSpace({ data, onChange }) {
  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces-active'],
    queryFn: () => base44.entities.SpaceConfig.filter({ is_active: true }),
  });

  if (isLoading) return <div className="animate-pulse h-48 bg-cp-muted rounded-xl" />;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-2">Choose Your Space</h2>
      <p className="text-gray-500 text-sm mb-6">All spaces accommodate up to 30 guests.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spaces.map(space => {
          const full = data.guest_count && parseInt(data.guest_count) > space.max_capacity;
          const selected = data.space === space.space_key;
          return (
            <button
              key={space.id}
              disabled={full}
              onClick={() => onChange({ space: space.space_key })}
              className={`text-left p-6 rounded-xl border-2 transition-all ${
                full ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50' :
                selected ? 'border-cp-primary bg-cp-primary/5 shadow-md' :
                'border-cp-border bg-white hover:border-cp-primary/50 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading text-lg font-bold text-cp-text">{space.display_name}</h3>
                {full && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Full</span>}
                {selected && <span className="text-xs bg-cp-primary text-white px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-sm text-gray-500 mb-3">{space.description}</p>
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-cp-primary" /> Up to {space.max_capacity}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-cp-primary" /> ${space.hourly_rate}/hr</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(space.amenities || []).map(a => (
                  <span key={a} className="text-xs flex items-center gap-0.5 bg-cp-muted text-gray-500 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3 text-cp-primary" /> {a}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}