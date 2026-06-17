import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Sparkles, ChevronDown, ChevronUp, Database, X } from 'lucide-react';
import ChartRenderer from './ChartRenderer';

export default function DataPanel({ reportId, sections }) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', section_id: '', data_type: 'manual', raw_data: '', source_file_url: '', source_file_name: '' });
  const [analyzing, setAnalyzing] = useState({});

  const loadEntries = async () => {
    const data = await base44.entities.AGRReportData.filter({ report_id: reportId });
    setEntries(data);
  };

  React.useEffect(() => { if (expanded) loadEntries(); }, [expanded, reportId]);

  const handleSave = async () => {
    if (!form.label.trim()) return;
    const entry = await base44.entities.AGRReportData.create({ ...form, report_id: reportId });
    setEntries(prev => [...prev, entry]);
    setForm({ label: '', section_id: '', data_type: 'manual', raw_data: '', source_file_url: '', source_file_name: '' });
    setShowForm(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, data_type: 'file_upload', source_file_url: file_url, source_file_name: file.name }));
  };

  const handleAnalyze = async (entryId) => {
    setAnalyzing(prev => ({ ...prev, [entryId]: true }));
    try {
      await base44.functions.invoke('analyzeReportData', { data_entry_id: entryId });
      await loadEntries();
    } catch {}
    setAnalyzing(prev => ({ ...prev, [entryId]: false }));
  };

  return (
    <div className="border rounded-xl bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
      >
        <Database className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Data &amp; Charts</span>
        <span className="text-xs text-muted-foreground ml-2">{entries.length} entries</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t">
          {entries.map(entry => {
            const chartConfig = entry.chart_config ? (typeof entry.chart_config === 'string' ? JSON.parse(entry.chart_config) : entry.chart_config) : null;
            return (
              <div key={entry.id} className="border rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{entry.data_type === 'file_upload' ? `File: ${entry.source_file_name}` : 'Manual entry'}{entry.section_id ? ` · Linked to section` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.status === 'analyzed' && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Analyzed</span>}
                    <Button variant="outline" size="sm" onClick={() => handleAnalyze(entry.id)} disabled={analyzing[entry.id]} className="gap-1 text-xs h-7">
                      <Sparkles className="w-3 h-3" />{analyzing[entry.id] ? '...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                {chartConfig && <ChartRenderer chartConfig={chartConfig} />}
                {entry.ai_narrative && <p className="text-xs text-slate-700 mt-2">{entry.ai_narrative}</p>}
              </div>
            );
          })}

          {showForm ? (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">New Data Entry</p>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Program Participation Data" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Link to Section (optional)</Label>
                <Select value={form.section_id} onValueChange={v => setForm(f => ({ ...f, section_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {sections?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Data (JSON format)</Label>
                <Textarea rows={4} value={form.raw_data} onChange={e => setForm(f => ({ ...f, raw_data: e.target.value }))} placeholder='[{"name": "Q1", "value": 120}, {"name": "Q2", "value": 150}]' className="mt-1 font-mono text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">or</span>
                <label className="cursor-pointer">
                  <span className="flex items-center gap-1 text-xs text-accent hover:underline"><Upload className="w-3 h-3" />Upload CSV/Excel/JSON/PDF</span>
                  <input type="file" accept=".csv,.xlsx,.json,.pdf" className="hidden" onChange={handleFileUpload} />
                </label>
                {form.source_file_name && <span className="text-xs text-green-600">{form.source_file_name}</span>}
              </div>
              <Button onClick={handleSave} disabled={!form.label.trim()} size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" />Add Entry</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowForm(true)} className="w-full gap-1" size="sm">
              <Plus className="w-3.5 h-3.5" />Add Data Entry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}