import { useState, useEffect } from 'react';
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
  const [noteTab, setNoteTab]         = useState('progress');

  const needsCompass = notes.filter(n => !n.compass_entered).length;

  // Split notes: regular progress notes vs CRT cross-reference update notes
  // (auto-created when a client is pushed from the Cross-Reference list).
  const regularNotes = notes.filter(n => n.item_key !== 'crt_crossref_update');
  const crossRefNotesRaw = notes.filter(n => n.item_key === 'crt_crossref_update');
  // De-duplicate cross-ref notes by date+content — repeated pushes (toggling
  // Updated, or the bulk "Push Updated → CRT" button) create near-identical
  // notes. Keep the most recent of each distinct snapshot.
  const crossRefNotes = (() => {
    const seen = new Set();
    const s = [...crossRefNotesRaw].sort((a, b) => new Date(b.date) - new Date(a.date));
    return s.filter(n => {
      const key = `${n.date}|${(n.note || '').trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  const regularSorted = [...regularNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Auto-select the cross-ref tab when that's the only notes available.
  useEffect(() => {
    if (noteTab === 'progress' && regularNotes.length === 0 && crossRefNotes.length > 0) {
      setNoteTab('crossref');
    }
  }, [noteTab, regularNotes.length, crossRefNotes.length]);

  // Parse a cross-ref note's pipe-delimited "Label: value | Label: value" body
  // into a readable field list for the dedicated sub-tab.
  const parseCrossRefFields = (text) => {
    if (!text) return [];
    return text.split(' | ').map(part => {
      const idx = part.indexOf(': ');
      if (idx < 0) return { label: '', value: part };
      return { label: part.slice(0, idx), value: part.slice(idx + 2) };
    });
  };

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
          {/* Sub-tab toggle: only show when cross-ref notes exist */}
          {crossRefNotes.length > 0 && (
            <div className="flex border-b border-slate-200">
              <button
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${noteTab === 'progress' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setNoteTab('progress')}
              >
                Progress Notes ({regularNotes.length})
              </button>
              <button
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${noteTab === 'crossref' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setNoteTab('crossref')}
              >
                CRT Cross-Reference Updates ({crossRefNotes.length})
              </button>
            </div>
          )}

          {noteTab === 'progress' ? (
            <>
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

              {regularSorted.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No progress notes yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {regularSorted.map(note => {
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
            </>
          ) : (
            <>
              {crossRefNotes.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No cross-reference updates yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {crossRefNotes.map(note => {
                    const fields = parseCrossRefFields(note.note);
                    return (
                      <div key={note.id} className="p-3 border-l-4 border-amber-300 bg-amber-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-amber-800 truncate">CRT Cross-Reference Update</span>
                            <span className="text-xs text-muted-foreground shrink-0">{note.date}</span>
                            {note.logged_by_name && <span className="text-xs text-muted-foreground shrink-0">— {note.logged_by_name}</span>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
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
                          </div>
                        </div>
                        {fields.length > 0 && (
                          <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
                            {fields.map((f, i) => (
                              <div key={i} className="contents">
                                <dt className="text-slate-500 font-medium whitespace-nowrap">{f.label}</dt>
                                <dd className="text-slate-700">{f.value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}