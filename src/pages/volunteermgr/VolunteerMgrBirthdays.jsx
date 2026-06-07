import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';

export default function VolunteerMgrBirthdays() {
  const [showEmail, setShowEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const queryClient = useQueryClient();

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers-birthdays'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 500)
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({
        to: data.to,
        subject: data.subject,
        body: data.message,
        from_name: 'Volunteer Manager'
      });
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', message: '' });
    },
  });

  const upcomingBirthdays = volunteers
    .filter(v => {
      if (!v.birth_date) return false;
      const bday = new Date(v.birth_date);
      const thisYear = new Date().getFullYear();
      const nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return nextBday >= now && nextBday <= in30Days;
    })
    .sort((a, b) => {
      const aBday = new Date(new Date().getFullYear(), new Date(a.birth_date).getMonth(), new Date(a.birth_date).getDate());
      const bBday = new Date(new Date().getFullYear(), new Date(b.birth_date).getMonth(), new Date(b.birth_date).getDate());
      return aBday - bBday;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Birthdays"
        description="Track volunteer birthdays in the next 30 days"
      />

      {upcomingBirthdays.length === 0 ? (
        <EmptyState icon={Gift} title="No upcoming birthdays" description="No birthdays in the next 30 days." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingBirthdays.map(vol => {
            const bday = new Date(vol.birth_date);
            const thisYear = new Date().getFullYear();
            const nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
            return (
              <Card key={vol.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(nextBday, 'MMMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{vol.first_name} {vol.last_name}</p>
                    <p className="text-sm text-muted-foreground">{vol.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <VolunteerTypeBadge type={vol.volunteer_type} />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setEmailForm({
                        to: vol.email,
                        subject: `Happy Birthday, ${vol.first_name}! 🎉`,
                        message: `Dear ${vol.first_name},\n\nWishing you a wonderful birthday! Thank you for being such a valued volunteer.\n\nBest regards,\nVolunteer Team`
                      });
                      setShowEmail(true);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Send Birthday Email
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Birthday Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendEmailMutation.mutate(emailForm); }} className="space-y-4">
            <div className="space-y-1">
              <Label>To</Label>
              <Input value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} className="h-48" required />
            </div>
            <Button type="submit" disabled={sendEmailMutation.isPending} className="w-full">
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}