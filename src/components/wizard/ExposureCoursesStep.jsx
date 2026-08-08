import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, GraduationCap, Clock, CheckCircle2, Link as LinkIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import ExposureCourseRequestForm from '@/components/wizard/ExposureCourseRequestForm';

const STATUS_BADGE = {
  pending: { className: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Clock },
  needs_more_info: { className: 'bg-yellow-100 text-yellow-800', label: 'Needs More Info' },
  approved: { className: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle2 },
  rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
};

export default function ExposureCoursesStep({ client, onSave }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.PurchaseRequest.filter({
        client_id: client.id,
        request_type: 'exposure_course',
      }, '-requested_date');
      setRecords(recs);
    } catch { toast.error('Failed to load exposure course requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingRecord(null);
    await fetchRecords();
    if (onSave) await onSave({ exposure_course: true });
  };

  const totalRequested = records.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const pending = records.filter(r => r.status === 'pending');
  const approved = records.filter(r => r.status === 'approved');
  const pendingTotal = pending.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const approvedTotal = approved.reduce((s, r) => s + (r.estimated_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Exposure Courses
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Request exposure courses (H2S Alive, First Aid, Forklift, etc.) for manager approval.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingRecord(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Request Exposure Course
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total Requested</div>
            <div className="text-lg font-bold text-slate-800">${totalRequested.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{records.length} request{records.length !== 1 ? 's' : ''}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</div>
            <div className="text-lg font-bold text-amber-700">${pendingTotal.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{pending.length} pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</div>
            <div className="text-lg font-bold text-green-700">${approvedTotal.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{approved.length} approved</div>
          </CardContent>
        </Card>
      </div>

      {showForm && !editingRecord && (
        <ExposureCourseRequestForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No exposure course requests yet. Click "Request Exposure Course" to submit one for manager approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map(rec => {
            const StatusIcon = STATUS_BADGE[rec.status]?.icon || Clock;
            const courseLabel = rec.course_type === 'Other' && rec.course_type_other
              ? rec.course_type_other : rec.course_type;
            return editingRecord?.id === rec.id
              ? <ExposureCourseRequestForm key={rec.id} client={client} existing={rec} onDone={handleDone} onCancel={() => setEditingRecord(null)} />
              : (
                <Card key={rec.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{courseLabel || '—'}</Badge>
                          <Badge className={`text-xs ${STATUS_BADGE[rec.status]?.className || ''}`}>
                            {StatusIcon && <StatusIcon className="w-3 h-3 mr-0.5" />} {STATUS_BADGE[rec.status]?.label || rec.status}
                          </Badge>
                          {rec.program_start_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Start {format(new Date(rec.program_start_date), 'MMM d, yy')}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{rec.requested_date || '—'}</span>
                        </div>
                        {rec.course_identifier && <div className="text-xs text-muted-foreground mt-1">ID: {rec.course_identifier}</div>}
                        {rec.vendor && <div className="text-xs text-muted-foreground">{rec.vendor}</div>}
                        {rec.description && <div className="text-sm mt-1 truncate">{rec.description}</div>}
                        {rec.course_link && (
                          <a href={rec.course_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                            <LinkIcon className="w-3 h-3" /> Course Link
                          </a>
                        )}
                        {rec.requested_by_name && (
                          <div className="text-xs text-muted-foreground mt-0.5">Requested by {rec.requested_by_name}</div>
                        )}
                        {rec.estimated_amount > 0 && (
                          <div className="text-xs font-medium mt-1">Estimated: ${(rec.estimated_amount || 0).toFixed(2)}</div>
                        )}
                        {rec.status === 'rejected' && rec.rejection_reason && (
                          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-1">
                            <span className="font-semibold">Rejected:</span> {rec.rejection_reason}
                          </div>
                        )}
                        {rec.status === 'needs_more_info' && rec.needs_more_info_note && (
                          <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                            <span className="font-semibold">Needs more info:</span> {rec.needs_more_info_note}
                          </div>
                        )}
                        {rec.status === 'approved' && (
                          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 mt-1">
                            <span className="font-semibold">Approved</span>
                            {rec.reviewed_by_name && <span className="block">by {rec.reviewed_by_name}</span>}
                          </div>
                        )}
                      </div>
                      {rec.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => { setEditingRecord(rec); setShowForm(false); }}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
          })}
        </div>
      )}
    </div>
  );
}