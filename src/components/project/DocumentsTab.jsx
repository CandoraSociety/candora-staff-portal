import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPES = [
  { value: 'supporting', label: 'Reference / Supporting' },
  { value: 'proposal', label: 'Submission Document' },
  { value: 'budget', label: 'Budget' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

function DocSection({ title, docs, onDelete, onExtract, onUpload, docType }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onUpload({ name: file.name, file_url, document_type: docType, file_type: file.type });
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <span className="font-semibold text-sm">{title}</span>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs pointer-events-none" disabled={uploading}>
            <Upload className="h-3.5 w-3.5" />{uploading ? 'Uploading…' : 'Upload'}
          </Button>
          <input type="file" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {docs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No documents yet</div>
      ) : (
        <div className="divide-y">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(d.created_date), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onExtract(d)} title="AI Extract">
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
                <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </a>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(d.id)}>
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

export default function DocumentsTab({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [extracting, setExtracting] = useState(null);
  const [extractResult, setExtractResult] = useState('');

  const { data: docs = [], refetch } = useQuery({
    queryKey: ['projectDocs', project.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project.id }, '-created_date'),
  });

  const handleUpload = async (data) => {
    await base44.entities.ProjectDocument.create({ project_id: project.id, ...data });
    refetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await base44.entities.ProjectDocument.delete(id);
    refetch();
  };

  const handleExtract = async (doc) => {
    setExtracting(doc.id);
    setExtractResult('');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extract and summarize the key information from this document relevant to a grant application. List important dates, requirements, eligibility criteria, and funding details.',
        file_urls: [doc.file_url],
      });
      setExtractResult(result);
    } catch (e) {
      setExtractResult('Could not extract: ' + e.message);
    }
    setExtracting(null);
  };

  const referenceDocs = docs.filter(d => ['supporting', 'other', 'correspondence'].includes(d.document_type));
  const submissionDocs = docs.filter(d => ['proposal', 'budget', 'contract'].includes(d.document_type));

  return (
    <div className="space-y-6 max-w-3xl">
      <DocSection
        title="Reference Documents"
        docs={referenceDocs}
        onDelete={handleDelete}
        onExtract={handleExtract}
        onUpload={handleUpload}
        docType="supporting"
      />
      <DocSection
        title="Submission Documents"
        docs={submissionDocs}
        onDelete={handleDelete}
        onExtract={handleExtract}
        onUpload={handleUpload}
        docType="proposal"
      />
      {extracting && (
        <div className="border rounded-xl p-4 text-sm text-muted-foreground flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Extracting document information…
        </div>
      )}
      {extractResult && (
        <div className="border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" />Extracted Information</span>
            <Button variant="ghost" size="sm" onClick={() => setExtractResult('')}>Clear</Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{extractResult}</p>
        </div>
      )}
    </div>
  );
}