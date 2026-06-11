import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function NotesPanel({ projectId, onClose }) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: notes = [], refetch } = useQuery({
    queryKey: ['projectNotes', projectId],
    queryFn: () => base44.entities.ProjectNote.filter({ project_id: projectId }, '-created_date'),
  });

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.ProjectNote.create({ project_id: projectId, note_type: 'general', content });
    setContent('');
    setAdding(false);
    refetch();
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-sm font-semibold">Quick Notes</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {adding && (
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              placeholder="Quick note…"
              autoFocus
              className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setAdding(false); setContent(''); }}>Cancel</Button>
              <Button size="sm" className="h-6 text-xs" onClick={handleSave} disabled={saving}>{saving ? '…' : 'Save'}</Button>
            </div>
          </div>
        )}
        {notes.map(n => (
          <div key={n.id} className="border rounded-lg p-2 bg-muted/30">
            <p className="text-xs whitespace-pre-wrap">{n.content}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_date), 'MMM d')}</p>
          </div>
        ))}
        {notes.length === 0 && !adding && <p className="text-xs text-muted-foreground text-center py-6">No notes yet</p>}
      </div>
    </div>
  );
}