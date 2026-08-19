import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, RotateCcw, ExternalLink, ShieldCheck, User, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { currentBillingMonth } from '@/components/billing/billingMonth';

const TALLY_COLORS = {
  'Exposure Course': 'bg-purple-100 text-purple-700',
  'Paid Work Exposure': 'bg-blue-100 text-blue-700',
  'Employment Supports': 'bg-cyan-100 text-cyan-700',
  'Workshop Attendance': 'bg-amber-100 text-amber-700',
  'Service Navigation Fee': 'bg-teal-100 text-teal-700',
  '90-Day Follow-Up': 'bg-green-100 text-green-700',
  'WD Placement Completion': 'bg-indigo-100 text-indigo-700',
  'Employment Start': 'bg-orange-100 text-orange-700',
};

function prettifyName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (s.includes('@')) s = s.split('@')[0];
  if (!s.includes(' ') && /[._-]/.test(s)) {
    return s.split(/[._-]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return s.split(/\s+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default function CompassTallyList({ currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth());
  const [tab, setTab] = useState('pending');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['compass-tally-list', billingMonth],
    queryFn: async () => (await base44.functions.invoke('buildCompassTallyList', { billingMonth })).data,
  });

  const items = data?.items || [];
  const pending = items.filter((i) => i.status !== 'verified');
  const verified = items.filter((i) => i.status === 'verified');
  const shown = tab === 'pending' ? pending : verified;

  const verifyMutation = useMutation({
    mutationFn: async (item) =>
      base44.entities.CompassTallyVerification.update(item.verification_id, {
        status: 'verified',
        verified_by: currentUser?.email || '',
        verified_by_name: currentUser?.full_name || currentUser?.email || '',
        verified_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compass-tally-list', billingMonth] });
      toast.success('Marked as verified in Compass');
    },
    onError: (e) => toast.error('Could not mark verified: ' + (e.message || '')),
  });

  const undoMutation = useMutation({
    mutationFn: async (item) =>
      base44.entities.CompassTallyVerification.update(item.verification_id, {
        status: 'pending',
        verified_by: '',
        verified_by_name: '',
        verified_date: '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compass-tally-list', billingMonth] });
      toast.info('Moved back to pending');
    },
    onError: (e) => toast.error('Could not undo: ' + (e.message || '')),
  });

  const groups = {};
  for (const i of shown) {
    const name = prettifyName(i.assigned_worker_name) || 'Unassigned';
    (groups[name] = groups[name] || []).push(i);
  }
  const groupKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing month</label>
            <Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="w-44" />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Rebuild list
          </Button>
        </div>
        <p className="text-xs text-slate-500 max-w-md">
          Clients below triggered a tally in the CRT Invoice Tracker for this month. Use this list to double-check each client's info is correct and up to date in Compass.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab('verified')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'verified' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Verified ({verified.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            {tab === 'pending' ? 'No pending verifications — all caught up!' : 'No clients verified yet.'}
          </p>
        </div>
      ) : (
        groupKeys.map((name) => (
          <div key={name} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: 'hsl(231,64%,20%)', color: 'white' }}>
                <User className="w-3.5 h-3.5" /> {name}
              </div>
              <span className="text-xs text-slate-400">{groups[name].filter((i) => i.status !== 'verified').length} pending</span>
            </div>
            <div className="space-y-2">
              {groups[name].map((item) => (
                <Card key={item.client_id} className={`border ${item.status === 'verified' ? 'border-green-200 bg-green-50/40' : 'border-slate-300 shadow-sm'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{item.client_name}</span>
                          {item.status === 'verified' && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Verified {item.verified_date ? format(new Date(item.verified_date), 'MMM d') : ''}
                            </Badge>
                          )}
                          {item.compass_verified ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">Compass entered</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">Not in Compass</Badge>
                          )}
                          {item.compass_hsid && <span className="text-xs text-slate-400">HSID: {item.compass_hsid}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                          {(item.tallies || []).map((t) => (
                            <span key={t} className={`text-xs font-medium px-2 py-0.5 rounded-full ${TALLY_COLORS[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/pathways/client/${item.client_id}`)} className="text-slate-500 gap-1 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" /> View Client
                        </Button>
                        {item.status === 'verified' ? (
                          <Button variant="ghost" size="sm" onClick={() => undoMutation.mutate(item)} disabled={undoMutation.isPending} className="text-slate-500 hover:text-amber-700 gap-1 text-xs">
                            <RotateCcw className="w-3.5 h-3.5" /> Undo
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => verifyMutation.mutate(item)} disabled={verifyMutation.isPending} className="gap-2 bg-green-700 hover:bg-green-800 text-white">
                            <CheckCircle2 className="w-4 h-4" /> Mark verified in Compass
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}