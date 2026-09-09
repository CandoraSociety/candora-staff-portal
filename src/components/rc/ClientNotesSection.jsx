import React from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, StickyNote, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Staff notes and safety alerts shown on the client profile card.
export default function ClientNotesSection({ notes = [], onChanged }) {
  if (notes.length === 0) return null;
  const remove = async (n) => {
    if (!window.confirm('Delete this note from the client profile?')) return;
    await base44.entities.RCClientNote.delete(n.id);
    onChanged?.();
  };

  const alerts = notes.filter(n => n.is_safety_alert);
  const plainNotes = notes.filter(n => !n.is_safety_alert);
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '';

  return (
    <>
      {alerts.map(n => (
        <div key={n.id} className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-red-900 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Safety Alert</p>
            <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-100 h-7 px-2" onClick={() => remove(n)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          {n.safety_alert_explanation && <p className="text-sm text-red-800 mt-1">{n.safety_alert_explanation}</p>}
          <p className="text-xs text-red-600 mt-1.5">{fmtDate(n.created_date)}{n.created_by_name ? ` · ${n.created_by_name}` : ''}</p>
        </div>
      ))}
      {plainNotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Staff Notes</p>
          <div className="space-y-2">
            {plainNotes.map(n => (
              <div key={n.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{n.note}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(n.created_date)}{n.created_by_name ? ` · ${n.created_by_name}` : ''}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2" onClick={() => remove(n)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}