import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "./RichTextEditor";
import MediaUploader from "./MediaUploader";

export default function StoryEditor({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial || {
        title: "", content: "", story_date: "", era: "",
        media: [], author: "", is_featured: false,
      });
    }
  }, [open, initial]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title?.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Story" : "Add Story"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title || ""} onChange={e => update("title", e.target.value)} placeholder="e.g. The Flood of 2018" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Story Date</Label>
              <Input type="date" value={form.story_date || ""} onChange={e => update("story_date", e.target.value)} />
            </div>
            <div>
              <Label>Era / Period</Label>
              <Input value={form.era || ""} onChange={e => update("era", e.target.value)} placeholder="e.g. The Early Years" />
            </div>
          </div>
          <div>
            <Label>Author / Curator</Label>
            <Input value={form.author || ""} onChange={e => update("author", e.target.value)} placeholder="Who wrote or curated this" />
          </div>
          <div>
            <Label>Story Content</Label>
            <RichTextEditor value={form.content} onChange={v => update("content", v)} placeholder="Tell the story..." />
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
          <Button onClick={handleSave} disabled={!form.title?.trim()}>{initial ? "Save Changes" : "Add Story"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}