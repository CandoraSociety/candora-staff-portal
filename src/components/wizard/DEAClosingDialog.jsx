import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function DEAClosingDialog({ open, onContinue, onSwitchToPathways, onDismiss }) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            DEA Program Ending Soon
          </DialogTitle>
          <DialogDescription>
            This client's 14-day DEA program period is ending within 3 days.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertDescription>
            Please choose how to proceed with this client's file.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onDismiss}>Dismiss</Button>
          <Button variant="secondary" onClick={onSwitchToPathways}>Switch to Pathways</Button>
          <Button onClick={onContinue}>Continue in DEA (Close File)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}