import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DAYS, CATEGORIES, formatHour } from "@/lib/scheduleConstants";
import { Trash2, Plus, Layers } from "lucide-react";

export default function ScheduleBlockDialog({ block, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(block);

  useEffect(() => { setDraft(block); }, [block]);

  const update = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));

  const alternates = draft.alternates || [];

  const addAlternate = () => {
    const newAlt = { id: `alt_${Date.now()}`, title: "", category: "other", location: "", notes: "" };
    setDraft(prev => ({ ...prev, alternates: [...(prev.alternates || []), newAlt] }));
  };

  const updateAlternate = (altId, field, value) => {
    setDraft(prev => ({
      ...prev,
      alternates: (prev.alternates || []).map(a => a.id === altId ? { ...a, [field]: value } : a),
    }));
  };

  const removeAlternate = (altId) => {
    setDraft(prev => ({ ...prev, alternates: (prev.alternates || []).filter(a => a.id !== altId) }));
  };

  const handleSave = () => {
    if (!draft.title.trim()) return;
    if (draft.end_hour <= draft.start_hour) return;
    onSave(draft);
  };

  const hours = [];
  for (let h = 0; h <= 24; h += 0.5) hours.push(h);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Block</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Title</Label>
            <Input value={draft.title || ""} onChange={e => update("title", e.target.value)} placeholder="e.g. Leadership Team Meeting" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Day</Label>
              <select value={draft.day_of_week} onChange={e => update("day_of_week", parseInt(e.target.value))} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <select value={draft.category} onChange={e => update("category", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Start</Label>
              <select value={draft.start_hour} onChange={e => update("start_hour", parseFloat(e.target.value))} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {hours.filter(h => h < draft.end_hour).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">End</Label>
              <select value={draft.end_hour} onChange={e => update("end_hour", parseFloat(e.target.value))} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {hours.filter(h => h > draft.start_hour).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Location (optional)</Label>
            <Input value={draft.location || ""} onChange={e => update("location", e.target.value)} placeholder="e.g. Boardroom / Zoom" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Notes (optional)</Label>
            <Textarea value={draft.notes || ""} onChange={e => update("notes", e.target.value)} rows={2} placeholder="Agenda items, prep needed, etc." />
          </div>

          {/* Alternate activities */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Alternate Activities</Label>
              <Button variant="outline" size="sm" onClick={addAlternate}><Plus className="w-3 h-3 mr-1" /> Add Alternate</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Backup options for this same time slot (e.g. if the meeting is cancelled).</p>
            {alternates.map((alt, idx) => (
              <div key={alt.id} className="rounded-md border p-2 space-y-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Option {idx + 2}</span>
                  <Input value={alt.title} onChange={e => updateAlternate(alt.id, "title", e.target.value)} placeholder="Alternate activity title" className="text-sm h-8" />
                  <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0 shrink-0" onClick={() => removeAlternate(alt.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={alt.category} onChange={e => updateAlternate(alt.id, "category", e.target.value)} className="h-8 rounded-md border border-input bg-transparent text-xs px-2">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <Input value={alt.location || ""} onChange={e => updateAlternate(alt.id, "location", e.target.value)} placeholder="Location" className="text-sm h-8" />
                </div>
                <Textarea value={alt.notes || ""} onChange={e => updateAlternate(alt.id, "notes", e.target.value)} rows={1} placeholder="Notes (optional)" className="text-xs" />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between">
          {onDelete ? (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { onDelete(draft); onClose(); }}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!draft.title.trim() || draft.end_hour <= draft.start_hour}>Save Block</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}