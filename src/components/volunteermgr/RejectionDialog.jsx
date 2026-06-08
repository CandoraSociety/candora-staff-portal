import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { XCircle, Mail, Eye, Edit } from 'lucide-react';

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
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmailBody, setPreviewEmailBody] = useState('');

  const handleReject = (withEmail) => {
    if (!reason) return;
    onReject(requestType, reason, details, withEmail, emailBody);
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
    onReject(requestType, reason, details, true, previewEmailBody);
    setReason('');
    setDetails('');
    setEmailBody('');
    setPreviewEmailBody('');
    setShowPreview(false);
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
            onClick={() => handleReject(false)}
            disabled={!reason || (['more_info_needed', 'other'].includes(reason) && !details.trim())}
          >
            Reject (No Email)
          </Button>
          <Button 
            variant="default"
            onClick={handlePreviewAndSend}
            disabled={!reason || (['more_info_needed', 'other'].includes(reason) && !details.trim())}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview & Send Email
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
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
                {requestType === 'cohort' ? 'Candora Society Volunteer Request Update' :
                 requestType === 'practicum' ? 'Practicum Placement Request Update' :
                 requestType === 'profile' ? 'Profile Change Request Update' :
                 'Volunteer Application Update'}
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

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-sm font-medium">Note:</p>
              <p className="text-amber-700 text-xs mt-1">
                The rejection reason ({reason ? REJECTION_REASONS[reason] : ''}) will NOT be automatically included in the email. 
                Add it manually above if you want the recipient to know.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Back to Edit</Button>
            <Button 
              variant="default"
              onClick={handleConfirmSend}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email & Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}