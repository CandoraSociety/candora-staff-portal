import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Hand, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import CollapsibleSection from '@/components/pathways/CollapsibleSection';

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
  pending: { card: '', badge: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Clock },
  needs_more_info: { card: 'border-yellow-300 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', label: 'Needs More Info', icon: AlertCircle },
  rejected: { card: 'border-red-300 bg-red-50', badge: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
  approved: { card: 'border-green-300 bg-green-50', badge: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle2 },
};

export default function MyPendingPurchaseRequests({ requests = [], currentUser }) {
  const myEmail = (currentUser?.email || '').toLowerCase();

  const mine = useMemo(
    () => requests
      .filter(r => (r.requested_by || '').toLowerCase() === myEmail)
      .sort((a, b) => (b.requested_date || '').localeCompare(a.requested_date || '')),
    [requests, myEmail]
  );

  if (mine.length === 0) return null;

  return (
    <div className="mb-5">
      <CollapsibleSection title="My Purchase Requests" count={mine.length} accentColor="#2b2de8" defaultOpen>
        <div className="space-y-2">
          {mine.map(r => {
            const style = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
            const StatusIcon = style.icon;
            return (
              <Card key={r.id} className={style.card}>
                <CardContent className="p-3">
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
                      {r.description && <div className="text-sm mt-1 truncate">{r.description}</div>}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        {r.product_link && (
                          <a href={r.product_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Product Link
                          </a>
                        )}
                        {r.purchase_exact_item && <Badge className="text-xs bg-blue-100 text-blue-800">Purchase exact item in link</Badge>}
                        {r.received_by_name && (
                          <span className="text-green-700 font-medium flex items-center gap-1">
                            <Hand className="w-3 h-3" /> Request received by: {r.received_by_name}
                          </span>
                        )}
                      </div>

                      {r.status === 'rejected' && r.rejection_reason && (
                        <div className="text-xs text-red-800 bg-red-100 border border-red-200 rounded p-2 mt-1.5">
                          <span className="font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                          <div className="mt-0.5">{r.rejection_reason}</div>
                          {r.reviewed_by_name && <div className="text-red-600 mt-0.5">by {r.reviewed_by_name} · {r.reviewed_date || ''}</div>}
                        </div>
                      )}
                      {r.status === 'needs_more_info' && r.needs_more_info_note && (
                        <div className="text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 rounded p-2 mt-1.5">
                          <span className="font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Needs More Information</span>
                          <div className="mt-0.5">{r.needs_more_info_note}</div>
                          {r.reviewed_by_name && <div className="text-yellow-700 mt-0.5">from {r.reviewed_by_name}</div>}
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <div className="text-xs text-green-800 bg-green-100 border border-green-200 rounded p-2 mt-1.5 space-y-0.5">
                          <div className="font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved & Purchased</div>
                          {r.purchase_date && <div>Purchased {r.purchase_date} · ${(r.total || 0).toFixed(2)}</div>}
                          {r.pickup_instructions && <div className="font-medium">Pick up: {r.pickup_instructions}</div>}
                          {r.purchase_notes && <div>Notes: {r.purchase_notes}</div>}
                          {r.receipt_url && (
                            <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 w-fit">
                              <ExternalLink className="w-3 h-3" /> Receipt
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-slate-800">${(r.estimated_amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Estimated</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}