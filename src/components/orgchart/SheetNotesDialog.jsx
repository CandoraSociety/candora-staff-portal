import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Notes for a single org chart sheet (the "Original" version or a scenario).
// Stored per sheet id — one record per sheet, created on first save.
export default function SheetNotesDialog({ open, onOpenChange, sheetId, sheetName }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ["ed-org-sheet-notes", sheetId],
    queryFn: () => base44.entities.EDOrgSheetNote.filter({ sheet_id: sheetId }),
    enabled: open && !!sheetId,
  });
  const record = existing[0];

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText(record?.notes || "");
  }, [open, record?.id]);

  const handleSave = async () => {
    if (!sheetId) return;
    setSaving(true);
    try {
      if (record) {
        await base44.entities.EDOrgSheetNote.update(record.id, { notes: text, updated_by_name: user?.full_name || "" });
      } else {
        await base44.entities.EDOrgSheetNote.create({ sheet_id: sheetId, notes: text, updated_by_name: user?.full_name || "" });
      }
      qc.invalidateQueries({ queryKey: ["ed-org-sheet-notes", sheetId] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notes — {sheetName || "Sheet"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading notes…
            </div>
          ) : (
            <Textarea
              rows={8}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Notes about this version of the org chart…`}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || isLoading}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}