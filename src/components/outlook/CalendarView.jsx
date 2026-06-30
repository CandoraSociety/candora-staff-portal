import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatEventTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupByDay(events) {
  const groups = {};
  events.forEach((event) => {
    const dayKey = new Date(event.start?.dateTime).toDateString();
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(event);
  });
  return Object.entries(groups).sort(([a], [b]) => new Date(a) - new Date(b));
}

export default function CalendarView({ events, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No upcoming events</p>
      </div>
    );
  }

  const grouped = groupByDay(events);

  return (
    <div className="space-y-6">
      {grouped.map(([dayKey, dayEvents]) => (
        <div key={dayKey}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {formatEventDate(dayEvents[0].start?.dateTime)}
          </h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div key={event.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex flex-col items-center justify-center w-16 flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {new Date(event.start?.dateTime).toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', '')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.start?.dateTime).toLocaleTimeString('en-US', { minute: '2-digit' }).replace(' ', '')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{event.subject || '(No title)'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatEventTime(event.start?.dateTime)} - {formatEventTime(event.end?.dateTime)}
                    </span>
                    {event.location?.displayName && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {event.location.displayName}
                      </span>
                    )}
                  </div>
                  {event.attendees?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}