import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, ExternalLink, Search, Link as LinkIcon, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

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

function RequestCard({ r, currentUser, onAcknowledge, showReceiver }) {
  const myEmail = (currentUser?.email || '').toLowerCase();
  const isPending = !r.received_by;
  const isMine = r.received_by && r.received_by.toLowerCase() === myEmail;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/pathways/client/${r.client_id}`}
                className="font-semibold hover:underline"
                style={{ color: 'hsl(231,64%,28%)' }}
              >
                {r.client_name || '—'}
              </Link>
              <Badge variant="outline" className="text-xs">
                {SUPPORT_TYPE_SHORT[r.support_type] || r.support_type}
                {r.support_type === 'Other' && r.support_type_other ? `: ${r.support_type_other}` : ''}
              </Badge>
              <Badge className="text-xs bg-amber-100 text-amber-800">Pending</Badge>
              <span className="text-xs text-muted-foreground">
                {r.requested_date ? format(new Date(r.requested_date), 'MMM d, yy') : '—'}
              </span>
            </div>
            {r.description && <div className="text-sm mt-1.5">{r.description}</div>}
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {r.product_link && (
                <a
                  href={r.product_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Product Link
                </a>
              )}
              {r.purchase_exact_item && (
                <Badge className="text-xs bg-blue-100 text-blue-800">Purchase exact item in link</Badge>
              )}
              {r.vendor && <span>Vendor: {r.vendor}</span>}
              <span>Requested by: {r.requested_by_name || r.requested_by || '—'}</span>
              {showReceiver && r.received_by_name && (
                <span className="text-green-700 font-medium flex items-center gap-1">
                  <Hand className="w-3 h-3" /> Request received by: {r.received_by_name}
                </span>
              )}
            </div>
            {r.notes && <div className="text-xs text-muted-foreground mt-1.5 italic">{r.notes}</div>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                ${(r.estimated_amount || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Estimated</div>
            </div>
            {isPending && (
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onAcknowledge(r)}
                  className="accent-green-600 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">I'll handle this</span>
              </label>
            )}
            {isMine && (
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

  const myEmail = (currentUser?.email || '').toLowerCase();

  const pending = useMemo(() => requests.filter(r => r.status === 'pending' && !r.received_by), [requests]);
  const mine = useMemo(
    () => requests.filter(r => r.status === 'pending' && r.received_by && r.received_by.toLowerCase() === myEmail),
    [requests, myEmail]
  );
  const others = useMemo(
    () => requests.filter(r => r.status === 'pending' && r.received_by && r.received_by.toLowerCase() !== myEmail),
    [requests, myEmail]
  );

  const applySearch = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(r =>
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.support_type || '').toLowerCase().includes(q) ||
      (r.requested_by_name || '').toLowerCase().includes(q) ||
      (r.requested_by || '').toLowerCase().includes(q) ||
      (r.received_by_name || '').toLowerCase().includes(q)
    );
  };

  const pendingFiltered = applySearch(pending);
  const mineFiltered = applySearch(mine);
  const othersFiltered = applySearch(others);

  const pendingTotal = pendingFiltered.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const mineTotal = mineFiltered.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const othersTotal = othersFiltered.reduce((s, r) => s + (r.estimated_amount || 0), 0);

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
          Employment support purchase requests submitted by career counsellors. Changes sync live across all managers.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search client, type, requester, handler..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Pending Purchase Requests */}
      <Section
        title="Pending Purchase Requests"
        count={pendingFiltered.length}
        total={pendingTotal}
        accent="amber"
      >
        {pendingFiltered.length === 0 ? (
          <Empty label="No pending purchase requests." />
        ) : (
          <div className="space-y-2">
            {pendingFiltered.map(r => (
              <RequestCard key={r.id} r={r} currentUser={currentUser} onAcknowledge={handleAcknowledge} showReceiver />
            ))}
          </div>
        )}
      </Section>

      {/* Requests I'm Handling */}
      <Section
        title="Requests I'm Handling"
        count={mineFiltered.length}
        total={mineTotal}
        accent="green"
      >
        {mineFiltered.length === 0 ? (
          <Empty label="You haven't acknowledged any requests yet." />
        ) : (
          <div className="space-y-2">
            {mineFiltered.map(r => (
              <RequestCard key={r.id} r={r} currentUser={currentUser} showReceiver />
            ))}
          </div>
        )}
      </Section>

      {/* Being Handled by Others */}
      <Section
        title="Being Handled by Others"
        count={othersFiltered.length}
        total={othersTotal}
        accent="slate"
      >
        {othersFiltered.length === 0 ? (
          <Empty label="No requests are currently being handled by others." />
        ) : (
          <div className="space-y-2">
            {othersFiltered.map(r => (
              <RequestCard key={r.id} r={r} currentUser={currentUser} showReceiver />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, count, total, accent, children }) {
  const accentMap = {
    amber: { badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
    green: { badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
    slate: { badge: 'bg-slate-200 text-slate-700', bar: 'bg-slate-400' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-5 rounded-full ${a.bar}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge className={`text-xs ${a.badge}`}>{count}</Badge>
        <span className="ml-auto text-sm font-semibold text-slate-600">${total.toFixed(2)}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ label }) {
  return (
    <Card>
      <CardContent className="py-6 text-center text-muted-foreground text-sm">{label}</CardContent>
    </Card>
  );
}