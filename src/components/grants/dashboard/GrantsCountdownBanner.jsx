import React from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';

export default function GrantsCountdownBanner({ deadlines = [] }) {
  const today = new Date();
  const upcoming = deadlines
    .map(d => ({ ...d, daysLeft: differenceInDays(parseISO(d.date), today) }))
    .filter(d => d.daysLeft >= 0 && d.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  const most = upcoming[0];
  const isUrgent = most.daysLeft <= 7;

  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className={`p-2 rounded-lg flex-shrink-0 ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
        {isUrgent ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
          {most.daysLeft === 0 ? 'Due today: ' : `${most.daysLeft} day${most.daysLeft === 1 ? '' : 's'} left: `}
          <span className="font-normal">{most.title}</span>
        </p>
        {upcoming.length > 1 && (
          <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
            +{upcoming.length - 1} more deadline{upcoming.length - 1 > 1 ? 's' : ''} in the next 30 days
          </p>
        )}
      </div>
      <Link to="/grants" className={`text-xs font-medium flex-shrink-0 ${isUrgent ? 'text-red-700 hover:text-red-900' : 'text-amber-700 hover:text-amber-900'}`}>
        View all →
      </Link>
    </div>
  );
}