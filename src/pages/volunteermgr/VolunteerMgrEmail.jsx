import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Mail, Users, Calendar } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Mail, Users, Calendar } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';

export default function VolunteerMgrEmail() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showEmail, setShowEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const queryClient = useQueryClient();

  const { data: volunteers = [] } = useQuery({ 
    queryKey: ['vol-volunteers'], 
    queryFn: () => base44.entities.Volunteer.list('-created_date', 500) 
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = data.to.split(',').map(e => e.trim()).filter(Boolean);
      const promises = recipients.map(to => 
        base44.integrations.Core.SendEmail({ 
          to, 
          subject: data.subject, 
          body: data.message, 
          from_name: 'Volunteer Manager' 
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', message: '' });
      setSelectedVolunteers([]);
    },
  });

  const volunteerTypes = [...new Set(volunteers.map(v => v.volunteer_type).filter(Boolean))];
  const statuses = [...new Set(volunteers.map(v => v.status).filter(Boolean))];

  const filtered = volunteers.filter(vol => {
    const matchesSearch = `${vol.first_name} ${vol.last_name} ${vol.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || vol.volunteer_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || vol.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectVolunteer = (id) => {
    setSelectedVolunteers(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVolunteers.length === filtered.length) {
      setSelectedVolunteers([]);
    } else {
      setSelectedVolunteers(filtered.map(v => v.id));
    }
  };

  const handleSendToSelected = () => {
    const selected = volunteers.filter(v => selectedVolunteers.includes(v.id));
    const emails = selected.map(v => v.email).filter(Boolean).join(',');
    setEmailForm({ to: emails, subject: '', message: '' });
    setShowEmail(true);
  };

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
        title="Email Volunteers"
        description="Send emails to volunteers by type or status"
      />

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Upcoming Birthdays (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBirthdays.slice(0, 6).map(vol => {
                const bday = new Date(vol.birth_date);
                const thisYear = new Date().getFullYear();
                const nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
                return (
                  <div key={vol.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                      <p className="text-xs text-muted-foreground">{format(nextBday, 'MMMM d')}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setEmailForm({
                          to: vol.email,
                          subject: `Happy Birthday, ${vol.first_name}! 🎉`,
                          message: `Dear ${vol.first_name},\n\nWishing you a wonderful birthday! Thank you for being such a valued volunteer.\n\nBest regards,\nVolunteer Team`
                        });
                        setShowEmail(true);
                      }}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {volunteerTypes.map(type => (
              <SelectItem key={type} value={type}>{type?.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Volunteers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{selectedVolunteers.length}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volunteer List */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No volunteers found" description="Adjust your filters." />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Volunteers ({filtered.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  {selectedVolunteers.length === filtered.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="sm" disabled={selectedVolunteers.length === 0} onClick={handleSendToSelected}>
                  <Mail className="w-4 h-4 mr-1" /> Email Selected ({selectedVolunteers.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.length === filtered.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 font-medium">Volunteer</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(vol => (
                  <tr key={vol.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.includes(vol.id)}
                        onChange={() => handleSelectVolunteer(vol.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4 font-medium">{vol.first_name} {vol.last_name}</td>
                    <td className="p-4">{vol.email}</td>
                    <td className="p-4"><VolunteerTypeBadge type={vol.volunteer_type} /></td>
                    <td className="p-4 capitalize">{vol.status}</td>
                    <td className="p-4">{vol.total_hours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Send Email</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendEmailMutation.mutate(emailForm); }} className="space-y-4">
            <div className="space-y-1">
              <Label>To (comma-separated emails)</Label>
              <Input value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} placeholder="email1@example.com, email2@example.com" required />
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
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}