import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ExternalLink, Link as LinkIcon, Hand, Clock } from 'lucide-react';
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

export default function MyPendingPurchaseRequests({ requests = [], currentUser }) {
  const myEmail = (currentUser?.email || '').toLowerCase();

  const mine = useMemo(
    () => requests.filter(r => r.status === 'pending' && (r.requested_by || '').toLowerCase() === myEmail),
    [requests, myEmail]
  );

  if (mine.length === 0) return null;

  return (
    <div className="mb-5">
      <CollapsibleSection title="My Pending Purchase Requests" count={mine.length} accentColor="#2b2de8" defaultOpen>
        <div className="space-y-2">
          {mine.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3">
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
                      {r.received_by ? (
                        <Badge className="text-xs bg-green-100 text-green-800 flex items-center gap-1">
                          <Hand className="w-3 h-3" /> Request received by: {r.received_by_name || r.received_by}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting manager
                        </Badge>
                      )}
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
                      {r.purchase_exact_item && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">Purchase exact item in link</Badge>
                      )}
                      {r.vendor && <span>Vendor: {r.vendor}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-800">${(r.estimated_amount || 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Estimated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}