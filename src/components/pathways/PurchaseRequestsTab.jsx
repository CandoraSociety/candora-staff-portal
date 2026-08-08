import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ExternalLink, Search, Hand, CheckCircle2, XCircle, AlertCircle, Gavel } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import DeterminationDialog from '@/components/pathways/DeterminationDialog';

const SUPPORT_TYPE_SHORT = {
  'PPE (Personal Protective Equipment)': 'PPE',
  'Bus Pass / Transit': 'Bus Pass',
  'Work Clothes': 'Work Clothes',
  'Safety Boots': 'Safety Boots',
  'Tools / Equipment': 'Tools',
  'Training Certificates': 'Training Cert',
  'First Aid Certification': 'First Aid',
  'Police Information Check': 'Police Check',
  "Driver's License": "Driver's License",
  'Childcare': 'Childcare',
  'Internet / Phone': 'Internet/Phone',
  'Other': 'Other',
};

const STATUS_STYLE = {
  pending: { card: '', badge: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Hand },
  needs_more_info: { card: 'border-yellow-300 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', label: 'Needs More Info', icon: AlertCircle },
  rejected: { card: 'border-red-300 bg-red-50', badge: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
  approved: { card: 'border-green-300 bg-green-50', badge: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle2 },
};

function StatusNotice({ r }) {
  if (r.status === 'rejected') {
    return (
      <div className="text-xs text-red-800 bg-red-100 border border-red-200 rounded p-2 mt-1.5">
        <span className="font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
        <div className="mt-0.5">{r.rejection_reason}</div>
        {r.reviewed_by_name && <div className="text-red-600 mt-0.5">Reviewed by {r.reviewed_by_name} · {r.reviewed_date || ''}</div>}
      </div>
    );
  }
  if (r.status === 'needs_more_info') {
    return (
      <div className="text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 rounded p-2 mt-1.5">
        <span className="font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Needs More Information</span>
        <div className="mt-0.5">{r.needs_more_info_note}</div>
        {r.reviewed_by_name && <div className="text-yellow-700 mt-0.5">Requested by {r.reviewed_by_name}</div>}
      </div>
    );
  }
  if (r.status === 'approved') {
    return (
      <div className="text-xs text-green-800 bg-green-100 border border-green-200 rounded p-2 mt-1.5 space-y-0.5">
        <div className="font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved & Purchased</div>
        {r.purchase_date && <div>Purchased {r.purchase_date} · ${(r.total || 0).toFixed(2)} (tax ${(r.tax || 0).toFixed(2)})</div>}
        {r.pickup_instructions && <div className="font-medium">Pick up: {r.pickup_instructions}</div>}
        {r.purchase_notes && <div>Notes: {r.purchase_notes}</div>}
        {r.receipt_url && (
          <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 w-fit">
            <ExternalLink className="w-3 h-3" /> Receipt
          </a>
        )}
      </div>
    );
  }
  return null;
}

function RequestCard({ r, currentUser, onAcknowledge, onDetermine, busy }) {
  const myEmail = (currentUser?.email || '').toLowerCase();
  const isPending = r.status === 'pending' && !r.received_by;
  const isMine = r.received_by && r.received_by.toLowerCase() === myEmail;
  const style = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
  const canDetermine = isMine && (r.status === 'pending' || r.status === 'needs_more_info');
  const StatusIcon = style.icon;

  return (
    <Card className={style.card}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/pathways/client/${r.client_id}`} className="font-semibold hover:underline" style={{ color: 'hsl(231,64%,28%)' }}>
                {r.client_name || '—'}
              </Link>
              <Badge variant="outline" className="text-xs">
                {SUPPORT_TYPE_SHORT[r.support_type] || r.support_type}
                {r.support_type === 'Other' && r.support_type_other ? `: ${r.support_type_other}` : ''}
              </Badge>
              <Badge className={`text-xs flex items-center gap-1 ${style.badge}`}>
                <StatusIcon className="w-3 h-3" /> {style.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {r.requested_date ? format(new Date(r.requested_date), 'MMM d, yy') : '—'}
              </span>
            </div>
            {r.description && <div className="text-sm mt-1.5">{r.description}</div>}
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {r.product_link && (
                <a href={r.product_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Product Link
                </a>
              )}
              {r.purchase_exact_item && <Badge className="text-xs bg-blue-100 text-blue-800">Purchase exact item in link</Badge>}
              {r.vendor && <span>Vendor: {r.vendor}</span>}
              <span>Requested by: {r.requested_by_name || r.requested_by || '—'}</span>
              {r.received_by_name && (
                <span className="text-green-700 font-medium flex items-center gap-1">
                  <Hand className="w-3 h-3" /> Request received by: {r.received_by_name}
                </span>
              )}
            </div>
            {r.notes && <div className="text-xs text-muted-foreground mt-1.5 italic">{r.notes}</div>}
            <StatusNotice r={r} />
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">${(r.estimated_amount || 0).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Estimated</div>
            </div>
            {isPending && (
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={false} disabled={busy} onChange={() => onAcknowledge(r)} className="accent-green-600 w-4 h-4" />
                <span className="text-xs font-medium text-slate-700">I'll handle this</span>
              </label>
            )}
            {canDetermine && (
              <Button onClick={() => onDetermine(r)} size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                <Gavel className="w-3.5 h-3.5 mr-1" /> Request Determination
              </Button>
            )}
            {isMine && r.status !== 'pending' && r.status !== 'needs_more_info' && (
              <Badge className="text-xs bg-green-100 text-green-800 flex items-center gap-1">
                <Hand className="w-3 h-3" /> I'm handling this
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PurchaseRequestsTab({ requests = [], currentUser }) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [determining, setDetermining] = useState(null);

  const myEmail = (currentUser?.email || '').toLowerCase();

  const pending = useMemo(() => requests.filter(r => r.status === 'pending' && !r.received_by), [requests]);
  const mine = useMemo(() => requests.filter(r => r.received_by && r.received_by.toLowerCase() === myEmail && (r.status === 'pending' || r.status === 'needs_more_info')), [requests, myEmail]);
  const others = useMemo(() => requests.filter(r => r.received_by && r.received_by.toLowerCase() !== myEmail && (r.status === 'pending' || r.status === 'needs_more_info')), [requests, myEmail]);
  const rejected = useMemo(() => requests.filter(r => r.status === 'rejected'), [requests]);
  const approved = useMemo(() => requests.filter(r => r.status === 'approved'), [requests]);

  const applySearch = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(r =>
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.support_type || '').toLowerCase().includes(q) ||
      (r.requested_by_name || '').toLowerCase().includes(q) ||
      (r.requested_by || '').toLowerCase().includes(q) ||
      (r.received_by_name || '').toLowerCase().includes(q) ||
      (r.rejection_reason || '').toLowerCase().includes(q) ||
      (r.needs_more_info_note || '').toLowerCase().includes(q)
    );
  };

  const handleAcknowledge = async (r) => {
    setBusy(true);
    try {
      await base44.entities.PurchaseRequest.update(r.id, {
        received_by: currentUser.email,
        received_by_name: currentUser.full_name || '',
        received_date: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success(`You are now handling ${r.client_name}'s request`);
    } catch { toast.error('Failed to acknowledge request'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'hsl(231,64%,20%)' }}>
          <ShoppingCart className="w-5 h-5" /> Purchase Requests
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Employment support purchase requests. Determinations sync live across all managers.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search client, type, requester, handler, notice..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
      </div>

      <Section title="Pending Purchase Requests" list={applySearch(pending)} accent="amber">
        {applySearch(pending).map(r => <RequestCard key={r.id} r={r} currentUser={currentUser} onAcknowledge={handleAcknowledge} busy={busy} />)}
      </Section>

      <Section title="Requests I'm Handling" list={applySearch(mine)} accent="green">
        {applySearch(mine).map(r => <RequestCard key={r.id} r={r} currentUser={currentUser} onDetermine={setDetermining} busy={busy} />)}
      </Section>

      <Section title="Being Handled by Others" list={applySearch(others)} accent="slate">
        {applySearch(others).map(r => <RequestCard key={r.id} r={r} currentUser={currentUser} busy={busy} />)}
      </Section>

      <Section title="Rejected" list={applySearch(rejected)} accent="red">
        {applySearch(rejected).map(r => <RequestCard key={r.id} r={r} currentUser={currentUser} busy={busy} />)}
      </Section>

      <Section title="Approved / Purchased" list={applySearch(approved)} accent="green">
        {applySearch(approved).map(r => <RequestCard key={r.id} r={r} currentUser={currentUser} busy={busy} />)}
      </Section>

      {determining && (
        <DeterminationDialog
          request={determining}
          currentUser={currentUser}
          onClose={() => setDetermining(null)}
          onDone={() => setDetermining(null)}
        />
      )}
    </div>
  );
}

function Section({ title, list, accent, children }) {
  const accentMap = {
    amber: { badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
    green: { badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
    slate: { badge: 'bg-slate-200 text-slate-700', bar: 'bg-slate-400' },
    red: { badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
  };
  const a = accentMap[accent] || accentMap.slate;
  const total = list.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-5 rounded-full ${a.bar}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge className={`text-xs ${a.badge}`}>{list.length}</Badge>
        <span className="ml-auto text-sm font-semibold text-slate-600">${total.toFixed(2)}</span>
      </div>
      {list.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No requests here.</CardContent></Card>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}