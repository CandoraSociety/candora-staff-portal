import React from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';

const CHANNEL_STYLE = {
  sent: 'bg-green-100 text-green-800',
  partial: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

const openAttachment = async (fileUri) => {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
  window.open(signed_url, '_blank', 'noopener');
};

// Everything the desk has already sent this family, newest first.
export default function GiftShopMessageHistoryDialog({ open, onOpenChange, invite, messages = [] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message history — {invite?.guardian_name}</DialogTitle>
          <DialogDescription>
            {messages.length === 0
              ? 'Nothing has been sent to this family yet.'
              : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'} sent to this family.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {messages.map(message => (
            <div key={message.id} className="rounded-lg border px-3 py-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{message.subject}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CHANNEL_STYLE[message.status] || CHANNEL_STYLE.sent}`}>
                  {[message.emailed && 'email', message.texted && 'text'].filter(Boolean).join(' + ') || 'not sent'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {message.sent_at ? new Date(message.sent_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                }) : ''}
                {message.sent_by_name ? ` · ${message.sent_by_name}` : ''}
              </p>
              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              {message.attachment_name && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAttachment(message.attachment_url)}
                  disabled={!message.attachment_url}
                >
                  <Paperclip className="h-3.5 w-3.5" /> {message.attachment_name}
                </Button>
              )}
              {message.failure_reason && <p className="text-xs text-red-700">{message.failure_reason}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}