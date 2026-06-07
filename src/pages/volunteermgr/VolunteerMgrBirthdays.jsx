import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Mail, Calendar } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import moment from 'moment';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';
import BirthdayCard from '@/components/volunteermgr/BirthdayCard';

export default function VolunteerMgrBirthdays() {
  const [cardVolunteer, setCardVolunteer] = useState(null);

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers-birthdays'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 500),
  });

  const today = moment();
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date && !v.is_deceased)
    .map(v => {
      const bday = moment(v.birth_date);
      let next = bday.clone().year(today.year());
      if (next.isBefore(today.clone().subtract(1, 'day'), 'day')) next = next.add(1, 'year');
      const daysUntil = next.diff(today.clone().startOf('day'), 'days');
      return { ...v, nextBirthday: next, daysUntil };
    })
    .filter(v => v.daysUntil >= -1 && v.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
      <PageHeader title="Upcoming Birthdays" description="Volunteer birthdays in the next 30 days" />

      {upcomingBirthdays.length === 0 ? (
        <EmptyState icon={Gift} title="No upcoming birthdays" description="No birthdays in the next 30 days." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {upcomingBirthdays.map(vol => (
            <Card key={vol.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {vol.first_name?.[0]}{vol.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{vol.first_name} {vol.last_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {vol.nextBirthday.format('MMMM D')}
                      </p>
                      {vol.email && <p className="text-xs text-muted-foreground">{vol.email}</p>}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${vol.daysUntil === 0 ? 'border-pink-400 text-pink-600 font-semibold' : ''}`}>
                    {vol.daysUntil === 0 ? '🎂 Today!' : vol.daysUntil < 0 ? 'Yesterday' : `${vol.daysUntil}d`}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <VolunteerTypeBadge type={vol.volunteer_type} />
                  <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCardVolunteer(vol)}>
                    <Gift className="w-3.5 h-3.5" /> Send Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BirthdayCard
        volunteer={cardVolunteer}
        open={!!cardVolunteer}
        onOpenChange={(o) => { if (!o) setCardVolunteer(null); }}
      />
    </div>
  );
}