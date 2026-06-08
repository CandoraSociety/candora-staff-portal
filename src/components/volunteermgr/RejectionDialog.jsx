import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { XCircle, Mail } from 'lucide-react';

const REJECTION_REASONS = {
  not_in_good_standing: 'Not in good standing with the organization',
  account_exists: 'A volunteer account already exists',
  more_info_needed: 'More information needed',
  other: 'Other',
};

export default function RejectionDialog({ open, onClose, onReject, requestType, requestName, requesterEmail }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [emailBody, setEmailBody] = useState('');

  const handleReject = () => {
    if (!reason) return;
    onReject(requestType, reason, details, sendEmail, emailBody);
    setReason('');
    setDetails('');
    setSendEmail(true);
    setEmailBody('');
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setSendEmail(true);
    setEmailBody('');
    onClose();
  };

  const getDefaultEmailBody = () => {
    const name = requestName || 'the requester';
    return `Dear ${name},\n\nThank you for your interest in volunteering with The Candora Society. After careful review, we are unable to move forward with your application at this time.\n\nWe appreciate your understanding and wish you all the best in your volunteer journey.\n\nWarm regards,\nThe Candora Society Volunteer Team`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Reject Request
          </DialogTitle>
          <DialogDescription>
            {requestName && `Request for: ${requestName}`}
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

          {['more_info_needed', 'other'].includes(reason) && (
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details *</Label>
              <Textarea
                id="details"
                placeholder={reason === 'more_info_needed' ? 'What information is needed?' : 'Please provide details...'}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {requesterEmail && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
                <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Send email notification to {requesterEmail}
                </Label>
              </div>

              {sendEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email-body">Email Message (editable)</Label>
                  <Textarea
                    id="email-body"
                    value={emailBody || getDefaultEmailBody()}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The rejection reason will NOT be included in the email. Add it manually if needed.
                  </p>
                </div>
              )}
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
            {sendEmail ? 'Reject & Send Email' : 'Reject Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}