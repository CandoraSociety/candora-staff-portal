import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ExternalLink, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_DOCS = [
  'Charitable Registration Certificate',
  'Certificate of Incorporation',
  'Audited Financial Statements',
  'Board List / Governance',
  'Annual Report',
  'Society Bylaws',
  'CRA T3010',
  'Letters of Support',
  'Logic Model',
  'Evaluation Framework',
  'Budget Template',
  'Staff Bios / Org Chart',
];

export default function SubmissionTab({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');

  const { data: docs = [], refetch } = useQuery({
    queryKey: ['submissionDocs', project.id],
    queryFn: () => base44.entities.SubmissionDocument.filter({ project_id: project.id }, 'sort_order'),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.SubmissionDocument.create({
      project_id: project.id,
      name: file.name,
      file_url,
      file_type: file.type,
      status: 'ready',
      sort_order: docs.length,
    });
    refetch();
    setUploading(false);
    e.target.value = '';
  };

  const handleAddPreset = async () => {
    if (!selectedPreset) return;
    await base44.entities.SubmissionDocument.create({
      project_id: project.id,
      name: selectedPreset,
      status: 'not_started',
      is_required: true,
      sort_order: docs.length,
    });
    setSelectedPreset('');
    refetch();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.SubmissionDocument.update(id, { status });
    refetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this document?')) return;
    await base44.entities.SubmissionDocument.delete(id);
    refetch();
  };

  const STATUS_COLORS = {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    submitted: 'bg-purple-100 text-purple-700',
    waived: 'bg-gray-100 text-gray-500',
  };

  const readyCount = docs.filter(d => ['ready', 'submitted'].includes(d.status)).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Final Submission Package</h3>
          <p className="text-sm text-muted-foreground">{readyCount} of {docs.length} documents ready</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <select value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="">Add preset document…</option>
              {PRESET_DOCS.filter(p => !docs.find(d => d.name === p)).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={handleAddPreset} disabled={!selectedPreset}>Add</Button>
          </div>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs pointer-events-none" disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />{uploading ? 'Uploading…' : 'Upload File'}
            </Button>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12 border rounded-xl text-muted-foreground text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No submission documents yet. Add preset required docs or upload files.</p>
        </div>
      ) : (
        <div className="border rounded-xl divide-y overflow-hidden">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors">
              {['ready', 'submitted'].includes(d.status)
                ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                : <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                {d.is_required && <span className="text-xs text-muted-foreground">Required</span>}
              </div>
              <select
                value={d.status}
                onChange={e => handleStatusChange(d.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[d.status] || 'bg-gray-100'}`}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="submitted">Submitted</option>
                <option value="waived">Waived</option>
              </select>
              {d.file_url && (
                <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </a>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}