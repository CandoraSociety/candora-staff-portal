import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Plus, Building2, Phone, Mail, MapPin, Briefcase, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import TimesheetSubmissionForm from '@/components/wizard/TimesheetSubmissionForm';
import EmployerProfileEditDialog from '@/components/employer-portal/EmployerProfileEditDialog';
import { toast } from 'sonner';
import { getEmployerSession } from '@/lib/employerPortalSession';

export default function EmployerDashboard() {
  const portalEmployerId = getEmployerSession();
  const isStaff = !portalEmployerId;
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [placements, setPlacements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [employer, setEmployer] = useState(null);

  const activeEmployerId = portalEmployerId || searchParams.get('employer') || '';

  const loadEmployer = async () => {
    if (!activeEmployerId) { setEmployer(null); return; }
    try {
      const all = await base44.entities.Employer.list('-created_date', 500);
      setEmployer(all.find(e => e.id === activeEmployerId) || null);
    } catch {
      setEmployer(null);
    }
  };

  useEffect(() => { loadEmployer(); /* eslint-disable-next-line */ }, [activeEmployerId]);

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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployerId]);

  const activePlacements = placements;

  return (
    <div className="space-y-6">
      {/* Branded hero */}
      <div className="rounded-xl p-6 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(231,64%,20%), hsl(231,55%,28%))' }}>
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold tracking-wide uppercase mb-1">
              <Building2 className="h-3.5 w-3.5" /> Pathways Employer Portal
            </div>
            <h1 className="text-2xl font-bold">{employer?.name || 'Employer Portal'}</h1>
            <p className="text-white/70 text-sm">Submit work exposure hours for your placement participants.</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            disabled={!activeEmployerId || activePlacements.length === 0}
            className="bg-amber-400 text-slate-900 hover:bg-amber-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Submit Hours
          </Button>
        </div>
      </div>

      {activeEmployerId && activePlacements.length === 0 && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No active work exposure participants are assigned to this company yet. A Candora career counsellor will link participants to your business once a placement begins.
          </CardContent>
        </Card>
      )}

      {showForm && (
        <TimesheetSubmissionForm
          placements={activePlacements}
          user={user}
          isStaff={isStaff}
          employer={employer}
          onDone={() => { setShowForm(false); fetchData(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingProfile && employer && (
        <EmployerProfileEditDialog
          employer={employer}
          onClose={() => setEditingProfile(false)}
          onSaved={() => { setEditingProfile(false); loadEmployer(); fetchData(); }}
        />
      )}

      {activeEmployerId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" style={{ color: 'hsl(231,64%,20%)' }}>
                <Clock className="h-5 w-5" /> Submitted Hours
              </CardTitle>
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
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: 'hsl(231,64%,20%)' }}>
                <Building2 className="h-5 w-5" /> Company Information
              </CardTitle>
              {!isStaff && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow icon={Building2} label="Company" value={employer?.name} />
              <InfoRow icon={Briefcase} label="Industry" value={employer?.industry} />
              <InfoRow icon={MapPin} label="Address" value={employer?.address} />
              <InfoRow icon={Phone} label="Phone" value={employer?.contact_phone} />
              <InfoRow icon={Mail} label="Login email" value={employer?.contact_email} />
              <InfoRow icon={Building2} label="Contact" value={employer?.contact_name} />
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