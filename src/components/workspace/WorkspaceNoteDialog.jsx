import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function WorkspaceNoteDialog({ item, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(item?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const updateNoteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.WorkspaceItem.update(item.id, { notes: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("Note saved");
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    updateNoteMutation.mutate();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Add a note to <strong>{item.original_name}</strong></p>
          <div>
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add your notes here..." className="h-32" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Note"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}