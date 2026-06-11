import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WordDocImporter from './WordDocImporter';

export default function DocViewerPanel({ projectId, initialDoc, onClose }) {
  const [activeDoc, setActiveDoc] = useState(initialDoc || null);
  const [showWordImporter, setShowWordImporter] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ['projectDocs', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }, '-created_date'),
  });

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPdf = (url) => url && /\.pdf$/i.test(url);

  return (
    <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-sm font-semibold">Document Viewer</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowWordImporter(true)}>Import .docx</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Doc list */}
        <div className="w-36 flex-shrink-0 border-r overflow-y-auto p-2 space-y-0.5">
          {docs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No docs uploaded</p>}
          {docs.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveDoc(d)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors truncate ${activeDoc?.id === d.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {d.name}
            </button>
          ))}
        </div>
        {/* Viewer */}
        <div className="flex-1 p-2 overflow-hidden">
          {!activeDoc ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Select a document</div>
          ) : isImage(activeDoc.file_url) ? (
            <img src={activeDoc.file_url} alt={activeDoc.name} className="max-w-full max-h-full object-contain" />
          ) : isPdf(activeDoc.file_url) ? (
            <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeDoc.file_url)}&embedded=true`} className="w-full h-full border-0 rounded" title={activeDoc.name} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-xs">{activeDoc.name}</p>
              <a href={activeDoc.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" />Open</Button>
              </a>
            </div>
          )}
        </div>
      </div>
      {showWordImporter && <WordDocImporter onClose={() => setShowWordImporter(false)} />}
    </div>
  );
}