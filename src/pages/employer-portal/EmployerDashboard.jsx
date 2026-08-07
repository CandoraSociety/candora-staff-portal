import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, FileText, Plus, Building2, Phone, Mail, MapPin, Briefcase, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import TimesheetSubmissionForm from '@/components/wizard/TimesheetSubmissionForm';
import { toast } from 'sonner';

export default function EmployerDashboard() {
  const { employerProfile, user } = useAuth();
  const isStaff = !employerProfile;
  const [searchParams, setSearchParams] = useSearchParams();
  const [placements, setPlacements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  // The employer whose portal we are viewing.
  const activeEmployerId = isStaff
    ? (searchParams.get('employer') || '')
    : (employerProfile?.id || '');

  // Staff mode: load the list of employers for the picker.
  useEffect(() => {
    if (!isStaff) return;
    base44.entities.Employer.list('-created_date', 500)
      .then(setEmployers)
      .catch(() => toast.error('Failed to load employers'));
  }, [isStaff]);

  // Resolve the selected employer object (employer users always see their own).
  useEffect(() => {
    if (!isStaff) { setSelectedEmployer(employerProfile); return; }
    if (!activeEmployerId) { setSelectedEmployer(null); return; }
    const found = employers.find(e => e.id === activeEmployerId) || null;
    setSelectedEmployer(found);
  }, [isStaff, activeEmployerId, employers, employerProfile]);

  const fetchData = async () => {
    if (!activeEmployerId) {
      setPlacements([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ps, subs] = await Promise.all([
        base44.entities.WorkExposurePlacement.filter({ employer_id: activeEmployerId }),
        base44.entities.WorkExposureHoursSubmission.filter({ employer_id: activeEmployerId }),
      ]);
      setPlacements(ps.filter(p => p.status !== 'cancelled'));
      setSubmissions(subs.sort((a, b) => (b.submitted_date || '').localeCompare(a.submitted_date || '')));
    } catch {
      toast.error('Failed to load placements');
    } finally {
      setLoading(false);
    }
  };

  // One-time: link this employer's User id to their Employer record if missing.
  useEffect(() => {
    if (employerProfile && !employerProfile.user_id && user?.id) {
      base44.entities.Employer.update(employerProfile.id, { user_id: user.id }).catch(() => {});
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployerId]);

  const onPickEmployer = (id) => {
    if (!id) setSearchParams({});
    else setSearchParams({ employer: id });
  };

  const activePlacements = placements;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isStaff
              ? 'Employer Portal — Staff Review'
              : `Welcome, ${employerProfile?.contact_name?.split(' ')[0] || 'Employer'}`}
          </h1>
          <p className="text-sm text-slate-600">
            {isStaff
              ? 'View a participating employer\'s portal and submit hours on their behalf.'
              : 'Submit work exposure hours for your placement participants.'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!activeEmployerId || activePlacements.length === 0}>
          <Plus className="w-4 h-4 mr-2" /> Submit Hours
        </Button>
      </div>

      {isStaff && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <UserCog className="w-4 h-4" /> Viewing as staff:
              </div>
              <div className="min-w-[260px]">
                <Select value={activeEmployerId} onValueChange={onPickEmployer}>
                  <SelectTrigger><SelectValue placeholder="Select an employer to view…" /></SelectTrigger>
                  <SelectContent>
                    {employers.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isStaff && !activeEmployerId && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Select an employer above to view their portal — placements, submitted hours, and company info.
          </CardContent>
        </Card>
      )}

      {activeEmployerId && activePlacements.length === 0 && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No active work exposure participants are assigned to this company yet.
            {isStaff ? ' Link participants to this employer from a client\'s Work Exposure tab.' : ' A Candora career counsellor will link participants to your business once a placement begins.'}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <TimesheetSubmissionForm
          placements={activePlacements}
          user={user}
          isStaff={isStaff}
          employer={selectedEmployer}
          onDone={() => { setShowForm(false); fetchData(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {activeEmployerId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5" /> Submitted Hours</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No hours submitted yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left">
                        <th className="py-2 px-3">Participant</th>
                        <th className="py-2 px-3">Period</th>
                        <th className="text-right py-2 px-3">Hours</th>
                        <th className="text-right py-2 px-3">Amount</th>
                        <th className="text-center py-2 px-3">Timesheet</th>
                        <th className="py-2 px-3">Submitted</th>
                        <th className="py-2 px-3">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => {
                        const p = placements.find(pp => pp.id === s.placement_id);
                        const rate = Number(p?.hourly_rate) || 15;
                        return (
                          <tr key={s.id} className="border-b last:border-0">
                            <td className="py-2 px-3 font-medium">{s.client_name}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {s.period_start_date ? format(new Date(s.period_start_date + 'T00:00:00'), 'MMM d') : ''} – {s.period_end_date ? format(new Date(s.period_end_date + 'T00:00:00'), 'MMM d, yy') : ''}
                            </td>
                            <td className="text-right py-2 px-3">{s.hours_worked}</td>
                            <td className="text-right py-2 px-3 font-semibold">${(Number(s.hours_worked) * rate).toFixed(2)}</td>
                            <td className="text-center py-2 px-3">
                              {s.timesheet_url ? (
                                <a href={s.timesheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 inline-flex"><FileText className="w-4 h-4" /></a>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-xs text-slate-500">
                              {s.submitted_date ? format(new Date(s.submitted_date + 'T00:00:00'), 'MMM d, yy') : ''}
                              {s.submitted_by_staff && <Badge variant="outline" className="ml-1 text-xs">by staff</Badge>}
                            </td>
                            <td className="py-2 px-3 text-xs text-slate-600 max-w-[240px] truncate" title={s.comments}>{s.comments || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5" /> Company Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow icon={Building2} label="Company" value={selectedEmployer?.name} />
              <InfoRow icon={Briefcase} label="Industry" value={selectedEmployer?.industry} />
              <InfoRow icon={MapPin} label="Address" value={selectedEmployer?.address} />
              <InfoRow icon={Phone} label="Phone" value={selectedEmployer?.contact_phone} />
              <InfoRow icon={Mail} label="Login email" value={selectedEmployer?.contact_email} />
              <InfoRow icon={Building2} label="Contact" value={selectedEmployer?.contact_name} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value || '—'}</div>
      </div>
    </div>
  );
}