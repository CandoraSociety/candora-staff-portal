import React from 'react';
import { Truck, Building2 } from 'lucide-react';

export default function StepBookingType({ data, onChange }) {
  const select = (type) => {
    if (type === 'inhouse_event' && data.guest_count > 30) onChange({ booking_type: type, guest_count: '' });
    else onChange({ booking_type: type });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold text-cp-text text-center mb-6">What type of event are you planning?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { type: 'external_event', icon: Truck, title: 'External Event', desc: 'You have your own venue — we bring the food, staff, and service to you. No guest limit.' },
          { type: 'inhouse_event', icon: Building2, title: 'In-House Event', desc: 'Book one of our intimate spaces (up to 30 guests) with full catering and ambiance.' },
        ].map(({ type, icon: Icon, title, desc }) => (
          <button
            key={type}
            onClick={() => select(type)}
            className={`text-left p-8 rounded-2xl border-2 transition-all hover:shadow-md ${
              data.booking_type === type
                ? 'border-cp-primary bg-cp-primary/5 shadow-md'
                : 'border-cp-border bg-white hover:border-cp-primary/50'
            }`}
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${data.booking_type === type ? 'bg-cp-primary text-white' : 'bg-cp-muted text-cp-primary'}`}>
              <Icon className="w-7 h-7" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 text-cp-text">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}