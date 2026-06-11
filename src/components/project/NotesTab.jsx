import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Camera, FileText, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';

const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'decision', label: 'Decision' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'funder_communication', label: 'Funder Communication' },
  { value: 'internal', label: 'Internal' },
];

export default function NotesTab({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [noteType, setNoteType] = useState('general');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const photoRef = useRef(null);

  const { data: notes = [], refetch } = useQuery({
    queryKey: ['projectNotes', project.id],
    queryFn: () => base44.entities.ProjectNote.filter({ project_id: project.id }, '-created_date'),
  });

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.ProjectNote.create({
      project_id: project.id,
      note_type: noteType,
      content,
    });
    setContent('');
    setAdding(false);
    refetch();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    await base44.entities.ProjectNote.delete(id);
    refetch();
  };

  const handleTogglePin = async (note) => {
    await base44.entities.ProjectNote.update(note.id, { is_pinned: !note.is_pinned });
    refetch();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTranscribing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const transcribed = await base44.integrations.Core.InvokeLLM({
      prompt: 'Transcribe the handwritten notes in this image exactly as written. Return only the transcribed text.',
      file_urls: [file_url],
    });
    setContent(prev => prev ? prev + '\n\n' + transcribed : transcribed);
    setAdding(true);
    setTranscribing(false);
  };

  const pinned = notes.filter(n => n.is_pinned);
  const regular = notes.filter(n => !n.is_pinned);

  const NoteCard = ({ note }) => (
    <div className="border rounded-xl p-4 bg-card space-y-2 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">{note.note_type?.replace('_', ' ')}</span>
          {note.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTogglePin(note)} title={note.is_pinned ? 'Unpin' : 'Pin'}>
            {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(note.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
      <p className="text-xs text-muted-foreground">{format(new Date(note.created_date), 'MMM d, yyyy h:mm a')}</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Project Notes</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => photoRef.current?.click()} disabled={transcribing}>
            <Camera className="h-3.5 w-3.5" />{transcribing ? 'Transcribing…' : 'Add Photo Note'}
          </Button>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />Add Note
          </Button>
        </div>
      </div>

      {adding && (
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <div className="flex items-center gap-3">
            <select value={noteType} onChange={e => setNoteType(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
              {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            placeholder="Write your note here…"
            autoFocus
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setContent(''); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>{saving ? 'Saving…' : 'Save Note'}</Button>
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pinned</p>
          <div className="space-y-3">{pinned.map(n => <NoteCard key={n.id} note={n} />)}</div>
        </div>
      )}
      {regular.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">All Notes</p>}
          <div className="space-y-3">{regular.map(n => <NoteCard key={n.id} note={n} />)}</div>
        </div>
      )}
      {notes.length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notes yet. Add your first note or import a handwritten photo.</p>
        </div>
      )}
    </div>
  );
}