import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import moment from 'moment';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';
import BirthdayCard from '@/components/volunteermgr/BirthdayCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function VolunteerMgrBirthdays() {
  const [cardVolunteer, setCardVolunteer] = useState(null);
  const [calMonth, setCalMonth] = useState(moment().startOf('month'));

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers-birthdays'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 500),
  });

  const today = moment();

  // Upcoming birthdays — next 30 days
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date && !v.is_deceased)
    .map(v => {
      const bday = moment(v.birth_date);
      let next = bday.clone().year(today.year());
      if (next.isBefore(today.clone().subtract(1, 'day'), 'day')) next = next.add(1, 'year');
      const daysUntil = next.diff(today.clone().startOf('day'), 'days');
      return { ...v, nextBirthday: next, daysUntil };
    })
    .filter(v => v.daysUntil >= 0 && v.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Calendar map
  const birthdayMap = {};
  volunteers.filter(v => v.birth_date && !v.is_deceased).forEach(v => {
    const key = moment(v.birth_date).format('MM-DD');
    if (!birthdayMap[key]) birthdayMap[key] = [];
    birthdayMap[key].push(v);
  });

  // Build calendar grid
  const startOfCal = calMonth.clone().startOf('month').startOf('week');
  const endOfCal = calMonth.clone().endOf('month').endOf('week');
  const calDays = [];
  const d = startOfCal.clone();
  while (d.isSameOrBefore(endOfCal, 'day')) { calDays.push(d.clone()); d.add(1, 'day'); }

  return (
    <div className="space-y-6">
      <PageHeader title="Birthdays" description="Upcoming volunteer birthdays" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Next 30 Days</h2>
          {upcomingBirthdays.length === 0 ? (
            <EmptyState icon={Gift} title="No upcoming birthdays" description="No birthdays in the next 30 days." />
          ) : (
            upcomingBirthdays.map(vol => (
              <Card key={vol.id} className={vol.daysUntil === 0 ? 'border-pink-300 bg-pink-50/30' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {vol.first_name?.[0]}{vol.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{vol.first_name} {vol.last_name}</p>
                    <p className="text-xs text-muted-foreground">{vol.nextBirthday.format('MMMM D')}</p>
                    <VolunteerTypeBadge type={vol.volunteer_type} className="mt-1" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={vol.daysUntil === 0 ? 'border-pink-400 text-pink-600 font-semibold' : ''}>
                      {vol.daysUntil === 0 ? '🎂 Today!' : `${vol.daysUntil}d`}
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1.5 text-pink-600 border-pink-200 hover:bg-pink-50"
                      onClick={() => setCardVolunteer(vol)}>
                      <Gift className="w-3.5 h-3.5" /> Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mini calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Birthday Calendar</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(calMonth.clone().subtract(1, 'month'))}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium w-28 text-center">{calMonth.format('MMMM YYYY')}</span>
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(calMonth.clone().add(1, 'month'))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map(day => {
                  const key = day.format('MM-DD');
                  const bdays = birthdayMap[key] || [];
                  const isToday = day.isSame(today, 'day');
                  const inMonth = day.month() === calMonth.month();
                  return (
                    <div key={day.format('YYYY-MM-DD')} className={`min-h-[44px] rounded p-0.5 text-[11px] flex flex-col items-center gap-0.5 ${isToday ? 'bg-pink-50 ring-1 ring-pink-300' : ''} ${!inMonth ? 'opacity-30' : ''}`}>
                      <span className={`font-medium text-xs ${isToday ? 'text-pink-500' : ''}`}>{day.date()}</span>
                      {bdays.slice(0, 2).map(vol => (
                        <button key={vol.id} onClick={() => setCardVolunteer(vol)} title={`${vol.first_name} ${vol.last_name}`}
                          className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 rounded px-0.5 text-[9px] truncate text-center">
                          🎂 {vol.first_name}
                        </button>
                      ))}
                      {bdays.length > 2 && <span className="text-[9px] text-muted-foreground">+{bdays.length - 2}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BirthdayCard
        volunteer={cardVolunteer}
        open={!!cardVolunteer}
        onOpenChange={open => { if (!open) setCardVolunteer(null); }}
      />
    </div>
  );
}