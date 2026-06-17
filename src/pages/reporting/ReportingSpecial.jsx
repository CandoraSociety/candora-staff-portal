import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X, Star, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ReportingSpecial() {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: () => base44.entities.GeneratedReport.list('-updated_date'),
  });

  const specialReports = reports.filter(r => r.report_type === 'special');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', content: '' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ title: '', description: '', content: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (r) => {
    setForm({
      title: r.title || '',
      description: r.description || '',
      content: r.content || '',
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const data = { ...form, report_type: 'special', frequency: 'none' };
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
          <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Special Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Ad-hoc reports for any purpose beyond regular obligations</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" />New Special Report
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? 'Edit Report' : 'New Special Report'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Board Presentation — Program Impact Summary" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this report for? Who is the audience?" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your special report content here... Pull data from any part of the app." />
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

      {specialReports.length === 0 && !showForm ? (
        <div className="text-center py-20 text-slate-400">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No special reports yet</p>
          <p className="text-sm mt-1">Create ad-hoc reports for board presentations, analysis, or any other purpose.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {specialReports.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="p-2 rounded-lg bg-accent/5 text-accent shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                    {r.updated_date && <span>Updated {format(new Date(r.updated_date), 'MMM d, yyyy')}</span>}
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