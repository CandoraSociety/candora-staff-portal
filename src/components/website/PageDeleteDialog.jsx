import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// The delete code that must be typed before anything is removed for good.
const DELETE_CODE = "5011";

// Deleting a selection for good takes a deliberate step: the delete code,
// typed on purpose. Until then it only waits in the archive.
export default function PageDeleteDialog({ target, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setCode("");
    setError("");
    onClose();
  };

  const confirm = async () => {
    if (code.trim() !== DELETE_CODE) {
      setError("That code is not correct.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(target);
      close();
    } catch (err) {
      setError(err.message || "It could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Delete this selection for good?</DialogTitle>
          <DialogDescription>
            “{target?.label}” will be removed permanently and cannot be put back. Type the delete code to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="page-delete-code">Delete code</Label>
          <Input
            id="page-delete-code"
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            placeholder="Enter the code"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete permanently
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}