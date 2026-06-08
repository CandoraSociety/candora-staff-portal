import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XCircle } from 'lucide-react';

const REJECTION_REASONS = {
  not_in_good_standing: 'Not in good standing with the organization',
  account_exists: 'A volunteer account already exists',
  more_info_needed: 'More information needed',
  other: 'Other',
};

export default function RejectionDialog({ open, onClose, onReject, requestType, requestName }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleReject = () => {
    if (!reason) return;
    onReject(requestType, reason, details);
    setReason('');
    setDetails('');
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Reject Request
          </DialogTitle>
          <DialogDescription>
            {requestName && `Rejecting request for: ${requestName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'more_info_needed' && (
            <div className="space-y-2">
              <Label htmlFor="details">What information is needed? *</Label>
              <Textarea
                id="details"
                placeholder="Please specify what additional information you need..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="details">Please specify *</Label>
              <Textarea
                id="details"
                placeholder="Please provide details..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={!reason || (['more_info_needed', 'other'].includes(reason) && !details.trim())}
          >
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}