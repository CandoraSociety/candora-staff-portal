import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, ExternalLink, Search, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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

export default function PurchaseRequestsTab({ requests = [] }) {
  const [search, setSearch] = useState('');

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);

  const filtered = useMemo(() => {
    if (!search) return pending;
    const q = search.toLowerCase();
    return pending.filter(r =>
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.support_type || '').toLowerCase().includes(q) ||
      (r.requested_by_name || '').toLowerCase().includes(q) ||
      (r.requested_by || '').toLowerCase().includes(q)
    );
  }, [pending, search]);

  const totalPending = filtered.reduce((s, r) => s + (r.estimated_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'hsl(231,64%,20%)' }}>
          <ShoppingCart className="w-5 h-5" /> Purchase Requests
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Employment support purchase requests submitted by career counsellors.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Pending Purchase Requests</h3>
        <Badge className="bg-amber-100 text-amber-800">{filtered.length}</Badge>
        <span className="ml-auto text-sm font-semibold text-slate-700">
          ${totalPending.toFixed(2)} estimated
        </span>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search client, type, requester..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No pending purchase requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id}>
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
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground mt-1.5 italic">{r.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-slate-800">
                      ${(r.estimated_amount || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Estimated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}