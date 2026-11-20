import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// The employee's own note kept with a suggestion — what they decided, who they
// spoke to, anything they want next to it when they come back to it.
export default function InsightNoteDialog({ insight, open, onOpenChange, onSave }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNote(insight?.note || "");
  }, [open, insight]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(note.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your note</DialogTitle>
          <DialogDescription className="text-xs">
            Kept with this suggestion. Only you can see it.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Called Kim — she'll send the figures by Friday."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save note"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}