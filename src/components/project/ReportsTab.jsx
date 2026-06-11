import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ExternalLink, Send, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  draft_complete: 'bg-amber-100 text-amber-700',
  under_review: 'bg-purple-100 text-purple-700',
  submitted: 'bg-green-100 text-green-700',
  accepted: 'bg-green-100 text-green-700',
  revision_requested: 'bg-red-100 text-red-700',
};

export default function ReportsTab({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', report_type: 'progress', due_date: '', assigned_to_name: '' });
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [uploading, setUploading] = useState(null);

  const { data: reports = [], refetch } = useQuery({
    queryKey: ['projectReports', project.id],
    queryFn: () => base44.entities.Report.filter({ project_id: project.id }, 'due_date'),
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await base44.entities.Report.create({
      project_id: project.id,
      title: form.title,
      report_type: form.report_type,
      due_date: form.due_date || undefined,
      assigned_to_name: form.assigned_to_name || undefined,
      status: 'not_started',
    });
    setForm({ title: '', report_type: 'progress', due_date: '', assigned_to_name: '' });
    setAdding(false);
    refetch();
    setSaving(false);
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Report.update(id, { status, ...(status === 'submitted' ? { submitted_date: new Date().toISOString().split('T')[0] } : {}) });
    refetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    await base44.entities.Report.delete(id);
    refetch();
  };

  const handleSendReminder = async (report) => {
    if (!report.assigned_to_name) return alert('No assignee set for this report.');
    setSendingReminder(report.id);
    await base44.integrations.Core.SendEmail({
      to: report.assigned_to || report.assigned_to_name,
      subject: `Report Reminder: ${report.title}`,
      body: `Hi ${report.assigned_to_name},\n\nThis is a reminder that the report "${report.title}" for project "${project.title}" is due${report.due_date ? ` on ${format(new Date(report.due_date), 'MMMM d, yyyy')}` : ''}.\n\nCurrent status: ${report.status?.replace('_', ' ')}\n\nPlease ensure this is completed on time.\n\nThank you.`,
    });
    setSendingReminder(null);
  };

  const handleUploadFile = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(id);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Report.update(id, { file_url });
    refetch();
    setUploading(null);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reports</h3>
        <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add Report</Button>
      </div>

      {adding && (
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Report Title *</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Q1 Progress Report" className="mt-1 h-8" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <select value={form.report_type} onChange={e => set('report_type', e.target.value)} className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="progress">Progress</option>
                <option value="interim">Interim</option>
                <option value="final">Final</option>
                <option value="financial">Financial</option>
                <option value="narrative">Narrative</option>
                <option value="outcome">Outcome</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1 h-8" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Assigned To</Label>
              <Input value={form.assigned_to_name} onChange={e => set('assigned_to_name', e.target.value)} placeholder="Name or email" className="mt-1 h-8" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Add Report'}</Button>
          </div>
        </div>
      )}

      {reports.length === 0 && !adding ? (
        <div className="text-center py-12 border rounded-xl text-muted-foreground text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No reports yet. Add your first reporting milestone.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="border rounded-xl p-4 bg-card group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{r.title}</p>
                    <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded capitalize">{r.report_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                    {r.due_date && <span>Due: {format(new Date(r.due_date), 'MMM d, yyyy')}</span>}
                    {r.assigned_to_name && <span>Assignee: {r.assigned_to_name}</span>}
                    {r.submitted_date && <span>Submitted: {format(new Date(r.submitted_date), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={r.status}
                    onChange={e => handleStatusChange(r.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="draft_complete">Draft Complete</option>
                    <option value="under_review">Under Review</option>
                    <option value="submitted">Submitted</option>
                    <option value="accepted">Accepted</option>
                    <option value="revision_requested">Revision Requested</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 pointer-events-none" disabled={uploading === r.id}>
                    <Upload className="h-3.5 w-3.5" />{uploading === r.id ? '…' : 'Attach File'}
                  </Button>
                  <input type="file" onChange={e => handleUploadFile(r.id, e)} className="hidden" />
                </label>
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><ExternalLink className="h-3.5 w-3.5" />View File</Button>
                  </a>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleSendReminder(r)} disabled={sendingReminder === r.id}>
                  <Send className="h-3.5 w-3.5" />{sendingReminder === r.id ? 'Sending…' : 'Send Reminder'}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive ml-auto" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}