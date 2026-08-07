import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Briefcase, Plus, Mail, Phone, MapPin, ChevronDown, ChevronRight, Clock, Send, Building2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const EMPTY = {
  name: '', first_name: '', last_name: '', position: '',
  contact_email: '', contact_phone: '', address: '', industry: '',
  alt_contact_name: '', alt_contact_position: '', alt_contact_phone: '', alt_contact_email: '',
  notes: '',
};

function EmployerFormDialog({ onDone, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Company name required');
    if (!form.contact_email.trim()) return toast.error('Contact email required');
    setSaving(true);
    try {
      await base44.entities.Employer.create({
        name: form.name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        position: form.position.trim(),
        contact_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        alt_contact_name: form.alt_contact_name.trim(),
        alt_contact_position: form.alt_contact_position.trim(),
        alt_contact_phone: form.alt_contact_phone.trim(),
        alt_contact_email: form.alt_contact_email.trim(),
        address: form.address.trim(),
        industry: form.industry.trim(),
        status: 'pending',
        notes: form.notes,
      });
      toast.success('Employer added');
      onDone();
    } catch (e) {
      toast.error('Failed: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Employer</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <Input placeholder="Company name *" value={form.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Contact first name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            <Input placeholder="Contact last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Position / title" value={form.position} onChange={e => set('position', e.target.value)} />
            <Input placeholder="Phone" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
          </div>
          <Input type="email" placeholder="Contact email (login) *" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
          <Input placeholder="Company address" value={form.address} onChange={e => set('address', e.target.value)} />
          <Input placeholder="Industry" value={form.industry} onChange={e => set('industry', e.target.value)} />
          <div className="text-xs font-semibold text-slate-500 pt-1">Alternate contact (optional)</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Alt name" value={form.alt_contact_name} onChange={e => set('alt_contact_name', e.target.value)} />
            <Input placeholder="Alt position" value={form.alt_contact_position} onChange={e => set('alt_contact_position', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Alt phone" value={form.alt_contact_phone} onChange={e => set('alt_contact_phone', e.target.value)} />
            <Input placeholder="Alt email" value={form.alt_contact_email} onChange={e => set('alt_contact_email', e.target.value)} />
          </div>
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Employer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PathwaysEmployers() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [submissionsByEmployer, setSubmissionsByEmployer] = useState({});

  const { data: employers = [], isLoading } = useQuery({
    queryKey: ['pathways-employers'],
    queryFn: () => base44.entities.Employer.list('-created_date', 500),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ employer }) => {
      await base44.users.inviteUser(employer.contact_email, 'user');
      await base44.entities.Employer.update(employer.id, {
        invite_sent: true,
        invite_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending',
      });
    },
    onSuccess: () => {
      toast.success('Invite sent — the employer will set their own password by email');
      queryClient.invalidateQueries({ queryKey: ['pathways-employers'] });
    },
    onError: (e) => toast.error('Invite failed: ' + (e.message || '')),
  });

  const toggle = async (emp) => {
    const isOpen = !!expanded[emp.id];
    setExpanded(p => ({ ...p, [emp.id]: !isOpen }));
    if (!isOpen && !submissionsByEmployer[emp.id]) {
      try {
        const subs = await base44.entities.WorkExposureHoursSubmission.filter({ employer_id: emp.id });
        setSubmissionsByEmployer(p => ({ ...p, [emp.id]: subs }));
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Building2 className="h-6 w-6" /> Employer Portal</h1>
          <p className="text-sm text-slate-600 mt-1">Manage employer accounts and review submitted work exposure hours.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 h-4 mr-2" /> Add Employer</Button>
          <Button asChild variant="outline">
            <Link to="/employer-portal"><ExternalLink className="w-4 h-4 mr-2" /> Open Employer Portal</Link>
          </Button>
        </div>
      </div>

      {showForm && (
        <EmployerFormDialog
          onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['pathways-employers'] }); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Employers ({employers.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
          ) : employers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No employers yet. Click "Add Employer" to create one, then invite them to the portal.</p>
          ) : (
            <div className="space-y-2">
              {employers.map(emp => {
                const subs = submissionsByEmployer[emp.id] || [];
                return (
                  <div key={emp.id} className="border rounded-lg">
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{emp.name}</span>
                          <Badge variant="outline" className="text-xs">{emp.status}</Badge>
                          {emp.invite_sent && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">invite sent</Badge>}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap gap-x-3">
                          {emp.contact_name && <span>{emp.contact_name}</span>}
                          {emp.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.contact_email}</span>}
                          {emp.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.contact_phone}</span>}
                          {emp.industry && <span>{emp.industry}</span>}
                          {emp.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.address}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!emp.invite_sent && emp.contact_email && (
                          <Button size="sm" variant="outline" onClick={() => inviteMutation.mutate({ employer: emp })} disabled={inviteMutation.isPending}>
                            <Send className="w-3.5 h-3.5 mr-1" /> Invite
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/employer-portal?employer=${emp.id}`}><ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in Portal</Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggle(emp)}>
                          {expanded[emp.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} Submissions
                        </Button>
                      </div>
                    </div>
                    {expanded[emp.id] && (
                      <div className="border-t bg-slate-50 p-3">
                        {subs.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">No hours submitted yet.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left">
                                <th className="py-1.5 px-2">Participant</th>
                                <th className="py-1.5 px-2">Period End</th>
                                <th className="text-right py-1.5 px-2">Hours</th>
                                <th className="py-1.5 px-2">By</th>
                                <th className="py-1.5 px-2">Timesheet</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subs.map(s => (
                                <tr key={s.id} className="border-b last:border-0">
                                  <td className="py-1.5 px-2 font-medium">{s.client_name}</td>
                                  <td className="py-1.5 px-2">{s.period_end_date ? format(new Date(s.period_end_date + 'T00:00:00'), 'MMM d, yy') : '—'}</td>
                                  <td className="text-right py-1.5 px-2">{s.hours_worked}</td>
                                  <td className="py-1.5 px-2 text-xs">{s.submitted_by_staff ? 'Staff' : 'Employer'}{s.submitted_date ? ` · ${format(new Date(s.submitted_date + 'T00:00:00'), 'MMM d')}` : ''}</td>
                                  <td className="py-1.5 px-2">{s.timesheet_url ? <a href={s.timesheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600">view</a> : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}