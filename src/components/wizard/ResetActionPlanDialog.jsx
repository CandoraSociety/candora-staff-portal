import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

// Reverses a saved Employment Action Plan so the client returns to "Not Started".
// Typing the client's last name is required before the reset button unlocks.
export default function ResetActionPlanDialog({ open, onOpenChange, client, onConfirm, saving }) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (open) setConfirmText('');
  }, [open]);

  const lastName = (client?.last_name || '').trim();
  const verified = !!lastName && confirmText.trim().toLowerCase() === lastName.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Reset this Employment Action Plan?
          </DialogTitle>
          <DialogDescription className="text-sm">
            This reverses the saved plan for <span className="font-semibold text-foreground">{client?.first_name} {client?.last_name}</span> and moves
            them back to <span className="font-semibold text-foreground">Not Started</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground space-y-1">
            <div className="font-semibold">This will clear:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>The plan's submitted status</li>
              <li>The selected action plan activities and their details</li>
              <li>The plan's additional notes</li>
            </ul>
            <div className="pt-1 text-muted-foreground">
              Placements, exposure courses, workshop signups and the program start date are not deleted.
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm" className="text-xs">
              Type the client's last name to verify ({lastName || 'last name'})
            </Label>
            <Input
              id="reset-confirm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={lastName}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!verified || saving}>
            {saving ? 'Resetting...' : 'Reset Action Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}