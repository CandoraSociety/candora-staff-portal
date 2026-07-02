import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "./RichTextEditor";
import MediaUploader from "./MediaUploader";

const ERAS = [
  { value: "founding", label: "Founding Era" },
  { value: "growth", label: "Growth Era" },
  { value: "expansion", label: "Expansion Era" },
  { value: "milestone", label: "Milestone" },
  { value: "modern", label: "Modern Era" },
];

const CATEGORIES = [
  { value: "founding", label: "Founding" },
  { value: "program_launch", label: "Program Launch" },
  { value: "partnership", label: "Partnership" },
  { value: "award", label: "Award" },
  { value: "leadership_change", label: "Leadership Change" },
  { value: "building_expansion", label: "Building Expansion" },
  { value: "crisis_response", label: "Crisis Response" },
  { value: "community_impact", label: "Community Impact" },
  { value: "other", label: "Other" },
];

const MONTHS = [
  { value: "", label: "—" },
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

export default function TimelineItemEditor({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial || {
        title: "", year: new Date().getFullYear(), month: "", day: "",
        era: "milestone", category: "other", summary: "", detailed_content: "",
        media: [], is_featured: false,
      });
    }
  }, [open, initial]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title?.trim() || !form.year) return;
    onSave({
      ...form,
      year: Number(form.year),
      month: form.month ? Number(form.month) : undefined,
      day: form.day ? Number(form.day) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Timeline Item" : "Add Timeline Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title || ""} onChange={e => update("title", e.target.value)} placeholder="e.g. Candora Opens Its Doors" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Year *</Label>
              <Input type="number" value={form.year || ""} onChange={e => update("year", e.target.value)} />
            </div>
            <div>
              <Label>Month</Label>
              <Select value={String(form.month || "")} onValueChange={v => update("month", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Day</Label>
              <Input type="number" min="1" max="31" value={form.day || ""} onChange={e => update("day", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Era</Label>
              <Select value={form.era || "milestone"} onValueChange={v => update("era", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ERAS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category || "other"} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={form.summary || ""} onChange={e => update("summary", e.target.value)} placeholder="Short summary shown on the timeline..." rows={2} />
          </div>
          <div>
            <Label>Detailed Content</Label>
            <RichTextEditor value={form.detailed_content} onChange={v => update("detailed_content", v)} placeholder="Full story of this event..." />
          </div>
          <div>
            <Label>Media (Photos, Videos, Clippings)</Label>
            <MediaUploader media={form.media || []} onChange={m => update("media", m)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_featured || false} onCheckedChange={v => update("is_featured", v)} />
            <Label>Feature on Archives Home</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title?.trim() || !form.year}>{initial ? "Save Changes" : "Add Item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}