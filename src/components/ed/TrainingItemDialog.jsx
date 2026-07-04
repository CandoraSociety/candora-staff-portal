import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PHASES, ITEM_TYPES, ITEM_STATUSES } from "@/lib/trainingConstants";

const EMPTY = {
  title: "",
  description: "",
  phase: "first_day",
  day_number: 1,
  time_block: "",
  duration_minutes: 30,
  item_type: "task",
  owner_name: "",
  owner_email: "",
  location: "",
  status: "not_started",
  notes: "",
  sort_order: 0,
};

export default function TrainingItemDialog({ open, onClose, onSave, editingItem, defaultPhase }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editingItem) {
      setForm({ ...EMPTY, ...editingItem });
    } else {
      setForm({ ...EMPTY, phase: defaultPhase || "first_day" });
    }
  }, [editingItem, open, defaultPhase]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const save = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Activity" : "Add Activity"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Activity Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" placeholder="e.g. Welcome & office tour, IT setup, Meet with supervisor" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" rows={2} placeholder="What this involves..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Phase</Label>
              <Select value={form.phase} onValueChange={v => set("phase", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Day #</Label>
              <Input type="number" min={1} value={form.day_number || ""} onChange={e => set("day_number", parseInt(e.target.value) || 1)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.item_type} onValueChange={v => set("item_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Time Block</Label>
              <Input value={form.time_block} onChange={e => set("time_block", e.target.value)} className="mt-1" placeholder="e.g. 9:00 AM, Morning" />
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input type="number" min={5} step={5} value={form.duration_minutes || ""} onChange={e => set("duration_minutes", parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Owner / Facilitator</Label>
              <Input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} className="mt-1" placeholder="Who's responsible?" />
            </div>
            <div>
              <Label className="text-xs">Owner Email</Label>
              <Input value={form.owner_email} onChange={e => set("owner_email", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={e => set("location", e.target.value)} className="mt-1" placeholder="e.g. Main office, Conference Room A" />
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!form.title.trim()}>
            {editingItem ? "Update Activity" : "Add Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}