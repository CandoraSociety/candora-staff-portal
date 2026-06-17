import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X, Users, Clock, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ReportingFunder() {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: () => base44.entities.GeneratedReport.list('-updated_date'),
  });

  const funderReports = reports.filter(r => r.report_type === 'funder');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', reporting_period_start: '', reporting_period_end: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ title: '', description: '', content: '', reporting_period_start: '', reporting_period_end: '', due_date: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (r) => {
    setForm({
      title: r.title || '',
      description: r.description || '',
      content: r.content || '',
      reporting_period_start: r.reporting_period_start || '',
      reporting_period_end: r.reporting_period_end || '',
      due_date: r.due_date || '',
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const data = { ...form, report_type: 'funder', frequency: 'custom' };
    if (editingId) {
      await base44.entities.GeneratedReport.update(editingId, data);
    } else {
      await base44.entities.GeneratedReport.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    await base44.entities.GeneratedReport.delete(id);
    queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Funder Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Reports prepared for funders with various frequencies and deadlines</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" />New Funder Report
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Edit Report' : 'New Funder Report'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Alberta Works Quarterly Progress Report" />
              </div>
              <div>
                <Label>Period Start</Label>
                <Input type="date" value={form.reporting_period_start} onChange={e => setForm(f => ({ ...f, reporting_period_start: e.target.value }))} />
              </div>
              <div>
                <Label>Period End</Label>
                <Input type="date" value={form.reporting_period_end} onChange={e => setForm(f => ({ ...f, reporting_period_end: e.target.value }))} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Funder name, reporting requirements, and notes..." />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your funder report content here..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.title.trim() || saving} className="gap-2">
                <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {funderReports.length === 0 && !showForm ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No funder reports yet</p>
          <p className="text-sm mt-1">Create reports tailored to your funders' requirements.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {funderReports.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="p-2 rounded-lg bg-accent/5 text-accent shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {r.reporting_period_start && (
                      <span>{format(new Date(r.reporting_period_start), 'MMM d, yy')} – {r.reporting_period_end ? format(new Date(r.reporting_period_end), 'MMM d, yy') : '—'}</span>
                    )}
                    {r.due_date && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due: {format(new Date(r.due_date), 'MMM d, yyyy')}</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} title="Delete" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}