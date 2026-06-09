import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, Trash2, Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const NOTE_CONFIG = {
  started:       { label: 'Started',    icon: Play,         card: 'border-blue-200 bg-blue-50',   iconClass: 'text-blue-600' },
  completed:     { label: 'Completed',  icon: CheckCircle2, card: 'border-green-200 bg-green-50', iconClass: 'text-green-600' },
  cancelled:     { label: 'Cancelled',  icon: null,         card: 'border-red-200 bg-red-50',     iconClass: 'text-red-600' },
  followup_90day:{ label: '90-Day',     icon: null,         card: 'border-purple-200 bg-purple-50',iconClass: 'text-purple-600' },
  manual:        { label: 'Note',       icon: null,         card: 'border-slate-300 bg-slate-50', iconClass: 'text-slate-500' },
};

export default function RoadmapProgressNotes({ notes, clientId, onNotesUpdate }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [showAdd,   setShowAdd]       = useState(false);
  const [newNote,   setNewNote]       = useState('');
  const [saving,    setSaving]        = useState(false);
  const [confirmId, setConfirmId]     = useState(null);

  const needsCompass = notes.filter(n => !n.compass_entered).length;

  const handleMarkCompass = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return; }
    let me = null;
    try { me = await base44.auth.me(); } catch (_) {}
    const updated = notes.map(n => n.id === id
      ? { ...n, compass_entered: true, compass_entered_date: new Date().toISOString().split('T')[0], compass_entered_by: me?.email, compass_entered_by_name: me?.full_name }
      : n
    );
    await onNotesUpdate(updated);
    setConfirmId(null);
  };

  const handleDelete = async (id) => {
    await onNotesUpdate(notes.filter(n => n.id !== id));
  };

  const handleAddManual = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'manual',
        item_label: 'Manual Note',
        item_key: 'manual',
        note: newNote.trim(),
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      };
      await onNotesUpdate([entry, ...notes]);
      setNewNote('');
      setShowAdd(false);
      toast.success('Note added');
    } finally { setSaving(false); }
  };

  const handleCopyAll = () => {
    const text = [...notes].reverse().map(n => `[${n.date}] ${n.item_label}: ${n.note}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const sorted = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 mt-4">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: 'hsl(231,64%,20%)', color: '#fff' }}
        onClick={() => setCollapsed(p => !p)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Client Progress Status Notes</span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{notes.length}</span>
          {needsCompass > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{needsCompass} need Compass entry</span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            className="text-white/70 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10"
            onClick={handleCopyAll}
          >
            <Copy className="w-3 h-3" /> Copy All
          </button>
          <button
            className="text-white/70 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10"
            onClick={() => setShowAdd(p => !p)}
          >
            <Plus className="w-3 h-3" /> Add Note
          </button>
          <span className="text-white/60">{collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="bg-white">
          {/* Add manual note */}
          {showAdd && (
            <div className="p-3 border-b border-slate-200 space-y-2">
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} placeholder="Add a manual progress note..." className="text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddManual} disabled={saving || !newNote.trim()}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewNote(''); }}>Cancel</Button>
              </div>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No progress notes yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {sorted.map(note => {
                const cfg = NOTE_CONFIG[note.event_type] || NOTE_CONFIG.manual;
                const Icon = cfg.icon;
                return (
                  <div key={note.id} className={`p-3 border-l-4 ${cfg.card}`} style={{ borderLeftColor: undefined }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.iconClass}`} />}
                        <span className="text-xs font-medium text-slate-700 truncate">{note.item_label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{note.date}</span>
                        {note.logged_by_name && <span className="text-xs text-muted-foreground shrink-0">— {note.logged_by_name}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Compass badge */}
                        {note.compass_entered ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">In Compass</span>
                        ) : (
                          <button
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${confirmId === note.id ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            onClick={() => handleMarkCompass(note.id)}
                          >
                            {confirmId === note.id ? 'Confirm?' : 'Enter in Compass'}
                          </button>
                        )}
                        {note.event_type === 'manual' && (
                          <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(note.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {note.note && <p className="text-xs text-slate-600 mt-1 ml-5">{note.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}