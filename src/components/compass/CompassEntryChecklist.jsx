import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ExternalLink, ClipboardList, CalendarDays, X, Plus, MessageSquare, CheckCircle2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { currentBillingMonth } from '@/components/billing/billingMonth';
import { fieldDescription } from '@/lib/compassChecklistDescriptions';

// Outcome + date fields are the actionable Compass entries — highlight them.
const OUTCOME_FIELDS = new Set([
  'DEA Start Date', 'Service Start Date',
  'Service Outcome', 'Service Outcome Date',
  'Placement Outcome', 'Placement Outcome Date',
  '30 Day Outcome', '30 Day Outcome Date',
  '60 Day Outcome', '60 Day Outcome Date',
  '90 Day Outcome', '90 Day Outcome Date',
  '180 Day Outcome', '180 Day Outcome Date',
]);

const monthLabel = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const monthLabelLong = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function CompassEntryChecklist() {
  const navigate = useNavigate();
  const [months, setMonths] = useState([currentBillingMonth()]);
  const [draftMonth, setDraftMonth] = useState('');
  const [noteDrafts, setNoteDrafts] = useState({});

  const monthsKey = useMemo(() => [...months].sort().join(','), [months]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['compass-entry-checklist-multi', monthsKey],
    queryFn: async () => (await base44.functions.invoke('getCompassEntryChecklist', { months })).data,
  });

  const { data: verifications = [], refetch: refetchVerifications } = useQuery({
    queryKey: ['compass-billing-verifications'],
    queryFn: async () => base44.entities.CompassBillingVerification.list('-verified_date', 500),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['compass-checklist-current-user'],
    queryFn: async () => { try { return await base44.auth.me(); } catch { return null; } },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ clientId, clientName }) => {
      const existing = verifications.find((v) => v.client_id === clientId);
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        client_id: clientId,
        client_name: clientName,
        verified_date: today,
        verified_by_name: currentUser?.full_name || currentUser?.email || '',
        verified_by_email: currentUser?.email || '',
        billing_months: [...months].sort(),
        corrections_in_crt: false,
        corrections_date: null,
        corrections_by_name: '',
        corrections_by_email: '',
      };
      if (existing) {
        return base44.entities.CompassBillingVerification.update(existing.id, payload);
      }
      return base44.entities.CompassBillingVerification.create(payload);
    },
    onSuccess: () => refetchVerifications(),
  });

  const notesMutation = useMutation({
    mutationFn: async ({ clientId, clientName, notes }) => {
      const existing = verifications.find((v) => v.client_id === clientId);
      const today = new Date().toISOString().slice(0, 10);
      const byName = currentUser?.full_name || currentUser?.email || '';
      if (existing) {
        return base44.entities.CompassBillingVerification.update(existing.id, {
          notes,
          notes_updated_date: today,
          notes_updated_by_name: byName,
        });
      }
      return base44.entities.CompassBillingVerification.create({
        client_id: clientId,
        client_name: clientName,
        notes,
        notes_updated_date: today,
        notes_updated_by_name: byName,
        billing_months: [...months].sort(),
      });
    },
    onSuccess: () => refetchVerifications(),
  });

  const correctionsMutation = useMutation({
    mutationFn: async ({ clientId, clientName, corrections }) => {
      const existing = verifications.find((v) => v.client_id === clientId);
      const today = new Date().toISOString().slice(0, 10);
      const byName = currentUser?.full_name || currentUser?.email || '';
      const byEmail = currentUser?.email || '';
      if (existing) {
        return base44.entities.CompassBillingVerification.update(existing.id, {
          corrections_in_crt: corrections,
          corrections_date: corrections ? today : null,
          corrections_by_name: corrections ? byName : '',
          corrections_by_email: corrections ? byEmail : '',
          verified_date: corrections ? null : existing.verified_date,
        });
      }
      return base44.entities.CompassBillingVerification.create({
        client_id: clientId,
        client_name: clientName,
        corrections_in_crt: corrections,
        corrections_date: corrections ? today : null,
        corrections_by_name: corrections ? byName : '',
        corrections_by_email: corrections ? byEmail : '',
        billing_months: [...months].sort(),
      });
    },
    onSuccess: () => refetchVerifications(),
  });

  const addMonth = () => {
    const m = draftMonth;
    if (!m) return;
    setMonths((prev) => (prev.includes(m) ? prev : [...prev, m]));
    setDraftMonth('');
  };
  const removeMonth = (m) => setMonths((prev) => prev.filter((x) => x !== m));

  const items = data?.items || [];
  const verification = (it) => it.client_id ? verifications.find((v) => v.client_id === it.client_id) : null;
  const isVerified = (it) => { const v = verification(it); return !!(v && v.verified_date && !v.corrections_in_crt); };
  const isCorrections = (it) => { const v = verification(it); return !!(v && v.corrections_in_crt); };
  const activeItems = items.filter((it) => !isVerified(it) && !isCorrections(it));
  const correctionsItems = items.filter((it) => isCorrections(it));
  const completedItems = items.filter((it) => isVerified(it));

  const deleteMutation = useMutation({
    mutationFn: async (verificationId) => base44.entities.CompassBillingVerification.delete(verificationId),
    onSuccess: () => refetchVerifications(),
  });

  const renderCard = (item, idx, section) => {
    const comments = item.fields.find((f) => f.label === 'Comments');
    const coreFields = item.fields.filter((f) => f.label !== 'Comments');
    const activeMonths = (item.active_months || []).slice().sort();
    const serviceElement = item.fields.find((f) => f.label === 'Service Element')?.value || '';
    const verification = item.client_id ? verifications.find((v) => v.client_id === item.client_id) : null;
    return (
      <Card key={idx} className="border-slate-300 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800">{item.client_name}</span>
              {item.hsid && <Badge variant="outline" className="text-slate-500">HSID: {item.hsid}</Badge>}
              {item.assigned_worker_name && (
                <span className="text-xs text-slate-400">· {item.assigned_worker_name}</span>
              )}
              {activeMonths.length > 1 && (
                <span className="flex items-center gap-1 text-xs text-accent font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Active: {activeMonths.map(monthLabel).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs text-slate-400">Row {item.row_number}</span>
              {section === 'completed' && verification && (
                <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified {verification.verified_date}
                </Badge>
              )}
              {section === 'corrections' && (
                <Badge className="bg-amber-100 text-amber-800 gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Corrections in CRT
                </Badge>
              )}
              {item.client_id && section === 'active' && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ clientId: item.client_id, clientName: item.client_name })}
                  className="gap-1 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as verified up to date
                </Button>
              )}
              {item.client_id && section === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={correctionsMutation.isPending}
                  onClick={() => correctionsMutation.mutate({ clientId: item.client_id, clientName: item.client_name, corrections: true })}
                  className="gap-1 text-xs border-amber-400 text-amber-800 hover:bg-amber-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Corrections in CRT
                </Button>
              )}
              {section === 'corrections' && item.client_id && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ clientId: item.client_id, clientName: item.client_name })}
                  className="gap-1 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as verified up to date
                </Button>
              )}
              {section === 'corrections' && verification && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={correctionsMutation.isPending}
                  onClick={() => correctionsMutation.mutate({ clientId: item.client_id, clientName: item.client_name, corrections: false })}
                  className="gap-1 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
              {section === 'completed' && verification && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(verification.id)}
                  className="gap-1 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
              {item.client_id && (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/pathways/client/${item.client_id}`)} className="text-slate-500 gap-1 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> View Client
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {coreFields.map((f, i) => {
              const desc = fieldDescription(f.label, f.value, serviceElement);
              return (
                <div key={i} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${OUTCOME_FIELDS.has(f.label) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {f.label}
                    </span>
                    <span className="text-slate-800 break-words min-w-0">{f.value}</span>
                  </div>
                  {desc && (
                    <p className="mt-0.5 ml-1 text-xs text-slate-400 flex gap-1.5 leading-snug">
                      <span className="shrink-0">•</span>
                      <span className="min-w-0">{desc}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {comments && comments.value && (
            <details className="group border-t border-slate-100 pt-2">
              <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 list-none">
                <MessageSquare className="w-3.5 h-3.5" />
                Comments
                <span className="text-slate-400 group-open:hidden">· show</span>
                <span className="text-slate-400 hidden group-open:inline">· hide</span>
              </summary>
              <p className="mt-1 mb-1 text-xs text-slate-400 flex gap-1.5 leading-snug">
                <span className="shrink-0">•</span>
                <span className="min-w-0">{fieldDescription('Comments', comments.value, serviceElement)}</span>
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-100">
                {comments.value}
              </p>
            </details>
          )}
          {item.client_id && (
            <div className="border border-emerald-300 bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Compass notes
                </label>
                {verification?.notes_updated_date && (
                  <span className="text-xs text-emerald-700">
                    Updated {verification.notes_updated_date}{verification.notes_updated_by_name ? ` by ${verification.notes_updated_by_name}` : ''}
                  </span>
                )}
              </div>
              <textarea
                value={(item.client_id in noteDrafts) ? noteDrafts[item.client_id] : (verification?.notes || '')}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.client_id]: e.target.value }))}
                placeholder="Add notes about keeping this client up to date in Compass…"
                className="w-full min-h-[70px] text-sm text-emerald-900 bg-white/70 border border-emerald-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-y"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={notesMutation.isPending}
                  onClick={() => notesMutation.mutate({
                    clientId: item.client_id,
                    clientName: item.client_name,
                    notes: (item.client_id in noteDrafts) ? noteDrafts[item.client_id] : (verification?.notes || ''),
                  })}
                  className="gap-1 text-xs border-emerald-400 text-emerald-800 hover:bg-emerald-100"
                >
                  <Save className="w-3.5 h-3.5" /> Save notes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add month</label>
              <Input type="month" value={draftMonth} onChange={(e) => setDraftMonth(e.target.value)} className="w-44" />
            </div>
            <Button variant="outline" size="sm" onClick={addMonth} disabled={!draftMonth} className="gap-2">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <p className="text-xs text-slate-500 max-w-md">
          Each card lists the filled Client Data fields for a client who had activity in any selected month — use it as a checklist for what to reflect in Compass. A client active in multiple months appears once.
        </p>
      </div>

      {/* Selected month chips */}
      <div className="flex flex-wrap items-center gap-2">
        {months.slice().sort().map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full pl-3 pr-1.5 py-1 text-xs font-medium">
            <CalendarDays className="w-3.5 h-3.5 opacity-70" />
            {monthLabelLong(m)}
            <button onClick={() => removeMonth(m)} className="ml-0.5 rounded-full hover:bg-black/10 p-0.5" title="Remove month">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {!isLoading && items.length > 0 && (
          <span className="text-xs text-slate-500 ml-1">{items.length} unique client{items.length === 1 ? '' : 's'}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No clients had activity in the selected month(s).</p>
        </div>
      ) : (
        <>
          {activeItems.length > 0 && (
            <div className="space-y-3">
              {activeItems.map((item, idx) => renderCard(item, idx, 'active'))}
            </div>
          )}
          {correctionsItems.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 pb-1 border-b border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Corrections in CRT ({correctionsItems.length})</h3>
                <p className="text-xs text-amber-700">Flagged for CRT correction — verify once corrected.</p>
              </div>
              {correctionsItems.map((item, idx) => renderCard(item, idx, 'corrections'))}
            </div>
          )}
          {completedItems.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 pb-1 border-b border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-800">Completed ({completedItems.length})</h3>
                <p className="text-xs text-emerald-700">Verified up to date — use Remove to clear from this list.</p>
              </div>
              {completedItems.map((item, idx) => renderCard(item, idx, 'completed'))}
            </div>
          )}
        </>
      )}
    </div>
  );
}