import { useState } from "react";
import { Archive, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// The delete code that must be typed before a header is removed for good.
const DELETE_CODE = "5011";

// Headers removed from a page wait here, so one can be put back. Deleting for
// good takes a deliberate step: the delete code, typed on purpose.
export default function ArchivedHeadersCard({ sections, onRestore, onDelete }) {
  const [target, setTarget] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setTarget(null);
    setCode("");
    setError("");
  };

  const confirmDelete = async () => {
    if (code.trim() !== DELETE_CODE) {
      setError("That code is not correct.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onDelete(target);
      close();
    } catch (err) {
      setError(err.message || "It could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/70">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-base font-bold text-foreground">Archived headers</h2>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {sections.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Headers removed from this page wait here. Put one back on the page, or delete it for good with the delete code.
        </p>

        {sections.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">Nothing archived on this page.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {sections.map((section) => (
              <div key={section.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{section.heading}</p>
                  {section.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{section.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onRestore(section)}>
                    <RotateCcw className="w-3.5 h-3.5" /> Re-add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setTarget(section)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Delete this header for good?</DialogTitle>
            <DialogDescription>
              “{target?.heading}” will be removed permanently and cannot be re-added. Type the delete code to
              confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="delete-code">Delete code</Label>
            <Input
              id="delete-code"
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmDelete();
              }}
              placeholder="Enter the code"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}