import React from 'react';
import { X, MailOpen, ArrowLeft } from 'lucide-react';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EmailReader({ email, onClose }) {
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
        <MailOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground hidden lg:block">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-foreground mb-2">{email.subject || '(No subject)'}</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
            {(email.from?.emailAddress?.name || email.from?.emailAddress?.address || '?')[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium">{email.from?.emailAddress?.name || email.from?.emailAddress?.address}</p>
            <p className="text-muted-foreground text-xs">{email.from?.emailAddress?.address}</p>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(email.receivedDateTime)}</span>
        </div>
        {email.toRecipients?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            To: {email.toRecipients.map(r => r.emailAddress?.name || r.emailAddress?.address).join(', ')}
          </p>
        )}
        {email.ccRecipients?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Cc: {email.ccRecipients.map(r => r.emailAddress?.name || r.emailAddress?.address).join(', ')}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div dangerouslySetInnerHTML={{ __html: email.body?.content || '<p class="text-muted-foreground">No content</p>' }} />
      </div>
    </div>
  );
}