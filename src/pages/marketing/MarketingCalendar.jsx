import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Megaphone, Mail, Share2, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';

const TYPE_COLORS = {
  campaign: 'bg-pink-100 text-pink-800 border-pink-200',
  email: 'bg-blue-100 text-blue-800 border-blue-200',
  social: 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function MarketingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: campaigns = [] } = useQuery({
    queryKey: ['mkt-campaigns-all'],
    queryFn: () => base44.entities.MarketingCampaign.list(),
  });
  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list(),
  });
  const { data: socialPosts = [] } = useQuery({
    queryKey: ['mkt-social-all'],
    queryFn: () => base44.entities.SocialPost.list(),
  });

  // Build calendar events
  const events = [
    ...campaigns.filter(c => c.start_date).map(c => ({ id: c.id, date: c.start_date, label: c.name, type: 'campaign', subtype: c.campaign_type })),
    ...campaigns.filter(c => c.end_date).map(c => ({ id: `${c.id}-end`, date: c.end_date, label: `End: ${c.name}`, type: 'campaign' })),
    ...emailCampaigns.filter(e => e.sent_date || e.scheduled_date).map(e => ({ id: e.id, date: (e.sent_date || e.scheduled_date).slice(0, 10), label: e.name, type: 'email' })),
    ...socialPosts.filter(p => p.scheduled_date).map(p => ({ id: p.id, date: p.scheduled_date.slice(0, 10), label: p.title, type: 'social' })),
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDay = (d) => events.filter(e => isSameDay(parseISO(e.date), d));

  // Annual campaigns for the sidebar
  const annualCampaigns = campaigns.filter(c => c.is_annual);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketing Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">View campaigns, email sends, and social posts in one place.</p>
      </div>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{format(currentDate, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                ))}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((d, di) => {
                    const dayEvents = getEventsForDay(d);
                    const isCurrentMonth = isSameMonth(d, currentDate);
                    const isToday = isSameDay(d, new Date());
                    return (
                      <div key={di} className={`min-h-[80px] border border-slate-100 p-1.5 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}`}>
                        <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-pink-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                          {format(d, 'd')}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayEvents.slice(0, 3).map(ev => (
                            <div key={ev.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${TYPE_COLORS[ev.type]}`} title={ev.label}>
                              {ev.label}
                            </div>
                          ))}
                          {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-64 space-y-4 shrink-0">
          {/* Legend */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: 'campaign', label: 'Campaign', icon: Megaphone },
                { type: 'email', label: 'Email Send', icon: Mail },
                { type: 'social', label: 'Social Post', icon: Share2 },
              ].map(l => {
                const Icon = l.icon;
                return (
                  <div key={l.type} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded border ${TYPE_COLORS[l.type]}`} />
                    <span>{l.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Annual Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                Annual Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {annualCampaigns.length === 0 ? (
                <p className="text-xs text-slate-400">No annual campaigns set up.</p>
              ) : (
                <div className="space-y-2">
                  {annualCampaigns.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate flex-1 mr-2">{c.name}</span>
                      {c.annual_month && (
                        <span className="text-slate-400 shrink-0">
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][c.annual_month - 1]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* This month summary */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">This Month</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Campaigns active</span>
                <span className="font-semibold">{campaigns.filter(c => c.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emails scheduled</span>
                <span className="font-semibold">{emailCampaigns.filter(e => e.status === 'scheduled').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Social posts</span>
                <span className="font-semibold">{socialPosts.filter(p => p.status === 'scheduled').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}