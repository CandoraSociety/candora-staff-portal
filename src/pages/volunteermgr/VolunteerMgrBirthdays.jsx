import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Calendar, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Mail, Calendar, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import moment from 'moment';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';

export default function VolunteerMgrBirthdays() {
  const [showEmail, setShowEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const queryClient = useQueryClient();

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list(undefined, 500),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({ to: data.to, subject: data.subject, body: data.body, from_name: 'Volunteer Manager' });
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', message: '' });
      setSelectedVolunteer(null);
    },
  });

  // Calculate upcoming birthdays (next 30 days)
  const today = moment();
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date)
    .map(v => {
      const birthDate = moment(v.birth_date);
      const nextBirthday = moment(today).month(birthDate.month()).date(birthDate.date());
      if (nextBirthday.isBefore(today, 'day')) {
        nextBirthday.add(1, 'year');
      }
      return {
        ...v,
        nextBirthday,
        daysUntil: nextBirthday.diff(today, 'days'),
        age: nextBirthday.year() - birthDate.year(),
      };
    })
    .filter(v => v.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const handleSendBirthdayEmail = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setEmailForm({
      to: volunteer.email,
      subject: `Happy Birthday, ${volunteer.first_name}! 🎉`,
      message: `Dear ${volunteer.first_name},\n\nHappy Birthday! 🎂\n\nOn behalf of the entire team, we want to wish you a wonderful birthday filled with joy and celebration.\n\nThank you for all your dedication and hard work as a volunteer. You make a real difference!\n\nWishing you all the best on your special day and in the year ahead.\n\nWarm regards,\nVolunteer Manager Team`,
    });
    setShowEmail(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteer Birthdays"
        description="Upcoming birthdays and birthday emails"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Gift className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">{upcomingBirthdays.length}</p>
              <p className="text-xs text-muted-foreground">Birthdays (30 days)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {upcomingBirthdays.filter(v => v.daysUntil <= 7).length}
              </p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{volunteers.filter(v => v.birth_date).length}</p>
              <p className="text-xs text-muted-foreground">With Birthdays</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Birthday */}
      {upcomingBirthdays.filter(v => v.daysUntil === 0).length > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Gift className="w-5 h-5" /> Today's Birthday{upcomingBirthdays.filter(v => v.daysUntil === 0).length > 1 ? 's' : ''}! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBirthdays.filter(v => v.daysUntil === 0).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-semibold">{v.first_name} {v.last_name}</p>
                    <p className="text-xs text-muted-foreground">Turning {v.age} today!</p>
                  </div>
                  <Button size="sm" onClick={() => handleSendBirthdayEmail(v)}>
                    <Mail className="w-4 h-4" /> Send Wish
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No upcoming birthdays"
          description="Birthdays within 30 days will appear here."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Birthdays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBirthdays.filter(v => v.daysUntil > 0).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{v.first_name} {v.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.volunteer_type && <VolunteerTypeBadge type={v.volunteer_type} />}
                        {' • '}Turning {v.age} on {v.nextBirthday.format('MMM D')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      v.daysUntil <= 7 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {v.daysUntil} day{v.daysUntil !== 1 ? 's' : ''}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleSendBirthdayEmail(v)}>
                      <Mail className="w-4 h-4 mr-1" /> Send Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Birthday Email {selectedVolunteer && `to ${selectedVolunteer.first_name}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendEmailMutation.mutate(emailForm); }} className="space-y-4">
            <div className="space-y-1">
              <Label>To Email *</Label>
              <Input type="email" value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} className="h-48" required />
            </div>
            <Button type="submit" disabled={sendEmailMutation.isPending} className="w-full">
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Birthday Email'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}