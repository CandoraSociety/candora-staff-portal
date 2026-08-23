import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, FileText, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SupportingDocUpload from '@/components/billing/SupportingDocUpload';
import WorkExposureManualEntry from '@/components/billing/WorkExposureManualEntry';
import { currentBillingMonth, parseBillingMonth } from '@/components/billing/billingMonth';

const TYPE_LABELS = {
  paid_external_placement: 'Work Exposure Placements',
  exposure_course: 'Exposure Courses',
  employment_supports: 'Employment Supports',
  childminding: 'Childminding',
};

const TYPE_COLORS = {
  paid_external_placement: 'bg-blue-100 text-blue-700',
  exposure_course: 'bg-purple-100 text-purple-700',
  employment_supports: 'bg-green-100 text-green-700',
  childminding: 'bg-pink-100 text-pink-700',
};

const REGISTRATION_STATUS_LABELS = {
  not_registered: 'Not Registered',
  registered: 'Registered',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
};

const REGISTRATION_STATUS_COLORS = {
  not_registered: 'bg-slate-100 text-slate-700',
  registered: 'bg-green-100 text-green-700',
  waitlisted: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

const COMPLETION_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  did_not_complete: 'Did Not Complete',
};

const COMPLETION_STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  did_not_complete: 'bg-red-100 text-red-700',
};

export default function SupportingDocuments({ financialRecords, clients }) {
  // Work Exposure section now has its own monthly manual-entry component.
  // The other sections below still use the shared financialRecords listing.
  const [syncing, setSyncing] = useState(false);
  const [cmMonth, setCmMonth] = useState(currentBillingMonth());

  const clientMap = useMemo(() => {
    const map = {};
    clients?.forEach(c => { map[c.id] = `${c.first_name} ${c.last_name}`; });
    return map;
  }, [clients]);

  const handleSyncChildminding = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncChildmindingToInvoiceTracker', {});
      const synced = (res.data?.results || []).filter(r => r.status === 'synced');
      const missing = (res.data?.results || []).filter(r => r.status === 'row_not_found');
      if (res.data?.status === 'success') {
        toast.success(`Synced ${synced.length} month(s) to the Invoice Tracker`, {
          description: synced.map(r => `${r.month} → row ${r.row} (CH): $${r.total.toFixed(2)}`).join('\n') || undefined,
        });
        if (missing.length) {
          toast.warning(`${missing.length} month(s) had no matching row`, {
            description: missing.map(r => r.month).join(', '),
          });
        }
      } else {
        toast.error(res.data?.message || 'Sync failed');
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const { data: childmindingRecords = [] } = useQuery({
    queryKey: ['childminding-records'],
    queryFn: () => base44.entities.ChildmindingRecord.list('-date', 1000),
  });

  const pathwaysChildminding = useMemo(
    () => (childmindingRecords || []).filter(r => r.program === 'pathways'),
    [childmindingRecords]
  );

  const monthChildminding = useMemo(
    () => pathwaysChildminding.filter(r => r.date && r.date.startsWith(cmMonth)),
    [pathwaysChildminding, cmMonth]
  );

  const stats = useMemo(() => {
    const records = financialRecords || [];
    const cmRecords = monthChildminding;
    const byType = {
      paid_external_placement: { total: 0, count: 0 },
      exposure_course: { total: 0, count: 0 },
      employment_supports: { total: 0, count: 0 },
      childminding: { total: 0, count: 0 },
    };
    records.forEach(r => {
      if (byType[r.record_type]) {
        byType[r.record_type].total += (r.record_type === 'employment_supports' || r.record_type === 'exposure_course') ? (r.amount || 0) : (r.total || 0);
        byType[r.record_type].count += 1;
      }
    });
    cmRecords.forEach(r => {
      byType.childminding.total += r.billing_amount || 0;
      byType.childminding.count += 1;
    });
    const total = records.reduce((s, r) => s + ((r.record_type === 'employment_supports' || r.record_type === 'exposure_course') ? (r.amount || 0) : (r.total || 0)), 0) + byType.childminding.total;
    return { total, byType };
  }, [financialRecords, monthChildminding]);

  const renderRecordsByType = (type) => {
    const records = (financialRecords || []).filter(r => r.record_type === type);
    const colSpanBefore = 5;
    const reimbursableTotal = records.reduce((sum, r) => sum + (r.amount || 0), 0);
    const taxTotal = records.reduce((sum, r) => sum + (r.tax || 0), 0);
    const totalWithTax = records.reduce((sum, r) => sum + (r.total || 0), 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No {TYPE_LABELS[type].toLowerCase()} records yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-2">Client</th>
                    <th className="text-left py-2 px-2">Description</th>
                    {type === 'exposure_course' && (
                      <th className="text-left py-2 px-2">Course Type</th>
                    )}
                    {type === 'employment_supports' && (
                      <th className="text-left py-2 px-2">Support Type</th>
                    )}
                    <th className="text-left py-2 px-2">Vendor</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-right py-2 px-2">Total Reimbursable</th>
                    <th className="text-right py-2 px-2">Tax</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-left py-2 px-2">Supporting Docs</th>
                    {type !== 'employment_supports' && <th className="text-left py-2 px-2">Notes</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr
                      key={record.id}
                      className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <td className="py-2 px-2 font-medium whitespace-nowrap">
                        {clientMap[record.client_id] || record.client_name || 'Unknown'}
                      </td>
                      <td className="py-2 px-2 max-w-[160px] truncate">{record.description}</td>
                      {type === 'exposure_course' && (
                        <td className="py-2 px-2 whitespace-nowrap">
                          {record.course_type_other || record.course_type || '-'}
                        </td>
                      )}
                      {type === 'employment_supports' && (
                        <td className="py-2 px-2 whitespace-nowrap">{record.course_type || '-'}</td>
                      )}
                      <td className="py-2 px-2 whitespace-nowrap">{record.vendor || '-'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{record.date || '-'}</td>
                      <td className="text-right py-2 px-2">${record.amount?.toFixed(2) || '0.00'}</td>
                      <td className="text-right py-2 px-2">${record.tax?.toFixed(2) || '0.00'}</td>
                      <td className="text-right py-2 px-2 font-bold">${record.total?.toFixed(2) || '0.00'}</td>
                      <td className="py-2 px-2">
                        <div className="space-y-0.5">
                          {record.receipt_urls?.length > 0 && record.receipt_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1" title={url.split('/').pop()}>
                              <ExternalLink className="w-2.5 h-2.5" /> {decodeURIComponent(url.split('/').pop()).slice(0, 28)}
                            </a>
                          ))}
                          {record.completion_record_urls?.length > 0 && record.completion_record_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-600 hover:underline flex items-center gap-1" title={url.split('/').pop()}>
                              <ExternalLink className="w-2.5 h-2.5" /> {decodeURIComponent(url.split('/').pop()).slice(0, 28)}
                            </a>
                          ))}
                          <SupportingDocUpload recordType="financial" record={record} urlField="receipt_urls" queryKey={['financial-records']} />
                        </div>
                      </td>
                      {type !== 'employment_supports' && <td className="py-2 px-2 max-w-[120px] truncate text-slate-600">{record.notes || '-'}</td>}
                    </tr>
                  ))}
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td colSpan={colSpanBefore} className="text-right py-2 px-2 font-semibold">SUBTOTAL:</td>
                    <td className="text-right py-2 px-2 font-bold text-base bg-amber-200/60 text-amber-900">${reimbursableTotal.toFixed(2)}</td>
                    <td className="text-right py-2 px-2 font-semibold">${taxTotal.toFixed(2)}</td>
                    <td className="text-right py-2 px-2 font-bold text-lg">${totalWithTax.toFixed(2)}</td>
                    <td colSpan={type === 'employment_supports' ? 1 : 2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderChildmindingSection = () => {
    // Sort by date of service (ascending) rather than by entry/creation order.
    const records = [...monthChildminding].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const subtotal = records.reduce((s, r) => s + (r.billing_amount || 0), 0);
    const cmMonthLabel = format(parseBillingMonth(cmMonth), 'MMMM yyyy');

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className={TYPE_COLORS.childminding}>{TYPE_LABELS.childminding}</Badge>
              <span className="text-xs text-slate-500 font-normal">— {cmMonthLabel}</span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Billing month</span>
                <Input
                  type="month"
                  value={cmMonth}
                  onChange={(e) => setCmMonth(e.target.value)}
                  className="w-[150px] h-8 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncChildminding}
                disabled={syncing || records.length === 0}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing…' : 'Sync to Invoice Tracker'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No childminding records for {cmMonthLabel}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-2">Child</th>
                    <th className="text-left py-2 px-2">Parent/Guardian</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Check-in</th>
                    <th className="text-left py-2 px-2">Check-out</th>
                    <th className="text-center py-2 px-2">Hours</th>
                    <th className="text-right py-2 px-2">Billing</th>
                    <th className="text-left py-2 px-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.id} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="py-2 px-2 font-medium whitespace-nowrap">{r.child_first_name || '-'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.parent_name || `${r.parent_first_name || ''} ${r.parent_last_name || ''}`.trim() || '-'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.date ? format(new Date(r.date + 'T00:00:00'), 'MMM d, yyyy') : '-'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.check_in_time || '-'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.check_out_time || '-'}</td>
                      <td className="text-center py-2 px-2">{r.hours || 0}</td>
                      <td className="text-right py-2 px-2 font-bold">${(r.billing_amount || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate text-slate-600">{r.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td colSpan={6} className="text-right py-2 px-2 font-semibold">SUBTOTAL:</td>
                    <td className="text-right py-2 px-2 font-bold text-lg">${subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.total.toFixed(2)}</p>
            <p className="text-xs text-slate-600 mt-1">
              {(financialRecords?.length || 0) + pathwaysChildminding.length} records
            </p>
          </CardContent>
        </Card>

        {Object.entries(TYPE_LABELS).map(([typeKey, label]) => (
          <Card key={typeKey}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Badge className={TYPE_COLORS[typeKey]}>{label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">${stats.byType[typeKey]?.total.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-slate-600 mt-1">
                {stats.byType[typeKey]?.count || 0} records
                {(typeKey === 'employment_supports' || typeKey === 'exposure_course') && <span className="block text-[10px] text-slate-500">(excluding tax)</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records by Type — all sections always visible */}
      <div className="space-y-4">
        <WorkExposureManualEntry clients={clients} />
        {renderRecordsByType('exposure_course')}
        {renderRecordsByType('employment_supports')}
        {renderChildmindingSection()}
      </div>
    </div>
  );
}