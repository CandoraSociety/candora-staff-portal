import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_LABELS = {
  exposure_course: 'Exposure Course',
  employment_supports: 'Employment Supports',
  paid_external_placement: 'Paid External Placement',
};

const TYPE_COLORS = {
  exposure_course: 'bg-purple-100 text-purple-700',
  employment_supports: 'bg-green-100 text-green-700',
  paid_external_placement: 'bg-blue-100 text-blue-700',
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
  const clientMap = useMemo(() => {
    const map = {};
    clients?.forEach(c => {
      map[c.id] = `${c.first_name} ${c.last_name}`;
    });
    return map;
  }, [clients]);

  const stats = useMemo(() => {
    const records = financialRecords || [];
    const total = records.reduce((sum, r) => sum + (r.total || 0), 0);
    const byType = {
      exposure_course: { total: 0, count: 0 },
      employment_supports: { total: 0, count: 0 },
      paid_external_placement: { total: 0, count: 0 },
    };

    records.forEach(r => {
      if (byType[r.record_type]) {
        byType[r.record_type].total += r.total || 0;
        byType[r.record_type].count += 1;
      }
    });

    return { total, byType };
  }, [financialRecords]);

  const renderRecordsByType = (type) => {
    const records = (financialRecords || []).filter(r => r.record_type === type);
    
    if (records.length === 0) return null;

    const subtotal = records.reduce((sum, r) => sum + (r.total || 0), 0);
    const taxTotal = records.reduce((sum, r) => sum + (r.tax || 0), 0);

    return (
      <Card key={type}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className={TYPE_COLORS[type]}>
              {TYPE_LABELS[type]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-2 px-2">Client</th>
                  <th className="text-left py-2 px-2">Description</th>
                  {type === 'exposure_course' && (
                    <>
                      <th className="text-left py-2 px-2">Course Type</th>
                      <th className="text-left py-2 px-2">Registration</th>
                      <th className="text-left py-2 px-2">Completion</th>
                    </>
                  )}
                  {type === 'employment_supports' && (
                    <th className="text-left py-2 px-2">Support Type</th>
                  )}
                  <th className="text-left py-2 px-2">Vendor</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Subtotal</th>
                  <th className="text-right py-2 px-2">Tax</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-left py-2 px-2">Receipts</th>
                  <th className="text-left py-2 px-2">Notes</th>
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
                    <td className="py-2 px-2 max-w-[160px] truncate">
                      {record.description}
                    </td>
                    {type === 'exposure_course' && (
                      <>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {record.course_type_other || record.course_type || '-'}
                        </td>
                        <td className="py-2 px-2">
                          <Badge
                            variant="outline"
                            className={REGISTRATION_STATUS_COLORS[record.registration_status] || 'bg-slate-100 text-slate-700'}
                          >
                            {REGISTRATION_STATUS_LABELS[record.registration_status] || record.registration_status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <Badge
                            variant="outline"
                            className={COMPLETION_STATUS_COLORS[record.completion_status] || 'bg-slate-100 text-slate-700'}
                          >
                            {COMPLETION_STATUS_LABELS[record.completion_status] || record.completion_status}
                          </Badge>
                        </td>
                      </>
                    )}
                    {type === 'employment_supports' && (
                      <td className="py-2 px-2 whitespace-nowrap">
                        {record.course_type || '-'}
                      </td>
                    )}
                    <td className="py-2 px-2 whitespace-nowrap">{record.vendor || '-'}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{record.date || '-'}</td>
                    <td className="text-right py-2 px-2">${record.amount?.toFixed(2) || '0.00'}</td>
                    <td className="text-right py-2 px-2">${record.tax?.toFixed(2) || '0.00'}</td>
                    <td className="text-right py-2 px-2 font-bold">${record.total?.toFixed(2) || '0.00'}</td>
                    <td className="py-2 px-2">
                      {record.receipt_urls?.length > 0 && (
                        <div className="space-y-0.5">
                          {record.receipt_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Receipt {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      {record.completion_record_urls?.length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          {record.completion_record_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-green-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Completion {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 max-w-[120px] truncate text-slate-600">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan={type === 'exposure_course' ? 10 : type === 'employment_supports' ? 8 : 9} className="text-right py-2 px-2 font-semibold">
                    SUBTOTAL:
                  </td>
                  <td className="text-right py-2 px-2 font-semibold">${taxTotal.toFixed(2)}</td>
                  <td className="text-right py-2 px-2 font-bold text-lg">${subtotal.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {financialRecords?.length || 0} records
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
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records by Type */}
      {financialRecords?.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              No financial records found
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Records are auto-populated when exposure courses and supports are logged in client profiles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {renderRecordsByType('exposure_course')}
          {renderRecordsByType('employment_supports')}
          {renderRecordsByType('paid_external_placement')}
        </div>
      )}
    </div>
  );
}