import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Mail, Eye } from 'lucide-react';

const WAITLIST_REASONS = {
  capacity_full: 'Current capacity is full - will contact when space available',
  pending_background_check: 'Pending background check completion',
  additional_training_needed: 'Additional training required before placement',
  seasonal_delay: 'Seasonal program - will start next season',
  other: 'Other',
};

export default function WaitlistDialog({ open, onClose, onWaitlist, requestType, requestName, requesterEmail }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [emailBody, setEmailBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmailBody, setPreviewEmailBody] = useState('');

  const handleWaitlist = (withEmail) => {
    if (!reason) return;
    onWaitlist(requestType, reason, details, withEmail, emailBody);
    setReason('');
    setDetails('');
    setEmailBody('');
    setPreviewEmailBody('');
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setEmailBody('');
    setPreviewEmailBody('');
    setShowPreview(false);
    onClose();
  };

  const handlePreviewAndSend = () => {
    const defaultBody = getDefaultEmailBody();
    setPreviewEmailBody(emailBody || defaultBody);
    setShowPreview(true);
  };

  const handleConfirmSend = () => {
    setEmailBody(previewEmailBody);
    onWaitlist(requestType, reason, details, true, previewEmailBody);
    setReason('');
    setDetails('');
    setEmailBody('');
    setPreviewEmailBody('');
    setShowPreview(false);
  };

  const getDefaultEmailBody = () => {
    const name = requestName || 'the volunteer';
    const baseMessage = `Dear ${name},\n\nThank you for your interest in volunteering with The Candora Society. We appreciate your enthusiasm and commitment to our mission.\n\nDue to current capacity, we are placing your application on our waitlist. This means we will keep your information on file and contact you as soon as a suitable opportunity becomes available.\n\nWe truly value your interest in making a difference with us and look forward to connecting with you soon.\n\nWarm regards,\nThe Candora Society Volunteer Team`;
    
    return baseMessage;
  };

  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              Review and edit the email before sending to {requesterEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preview-to">To:</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">{requesterEmail}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview-subject">Subject:</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                {requestType === 'practicum' ? 'Practicum Placement Request - Waitlist Status' :
                 'Volunteer Application - Waitlist Status'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview-body">Email Message (editable):</Label>
              <Textarea
                id="preview-body"
                value={previewEmailBody}
                onChange={(e) => setPreviewEmailBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Back to Edit</Button>
            <Button 
              variant="default"
              onClick={handleConfirmSend}
              className="gap-2 bg-amber-500 hover:bg-amber-600"
            >
              <Mail className="w-4 h-4" />
              Send Email & Waitlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Clock className="w-5 h-5" />
            Place on Waitlist
          </DialogTitle>
          <DialogDescription>
            {requestName && `Request for: ${requestName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-reason">Waitlist Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WAITLIST_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {['other'].includes(reason) && (
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details *</Label>
              <Textarea
                id="details"
                placeholder="Please provide details..."
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
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button 
            variant="outline" 
            onClick={() => handleWaitlist(false)}
            disabled={!reason || (['other'].includes(reason) && !details.trim())}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Waitlist (No Email)
          </Button>
          <Button 
            variant="default"
            onClick={handlePreviewAndSend}
            disabled={!reason || (['other'].includes(reason) && !details.trim())}
            className="gap-2 bg-amber-500 hover:bg-amber-600"
          >
            <Eye className="w-4 h-4" />
            Preview & Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}