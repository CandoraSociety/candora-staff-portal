import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBasket, HandHelping, CalendarCheck } from 'lucide-react';

// The three front-desk visit types. Picked first, before any client is named.
export const VISIT_TYPES = [
  {
    key: 'grab_and_go',
    label: 'Grab and Go Resources',
    description: 'Bus tickets, emergency food, supplies and other quick resources',
    icon: ShoppingBasket,
  },
  {
    key: 'drop_in_casework',
    label: 'Drop-In Casework',
    description: 'Complete intake information and route the visit to the assigned caseworker',
    icon: HandHelping,
  },
  {
    key: 'scheduled',
    label: 'Scheduled Visit',
    description: "Casework visit auto-assigned from the client's appointment schedule",
    icon: CalendarCheck,
  },
];

export default function VisitTypeCards({ onSelect, includeGrabAndGo = true }) {
  const options = VISIT_TYPES.filter(t => includeGrabAndGo || t.key !== 'grab_and_go');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map(type => {
        const Icon = type.icon;
        return (
          <button key={type.key} onClick={() => onSelect(type.key)} className="text-left">
            <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/40">
              <CardContent className="p-4">
                <Icon className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}