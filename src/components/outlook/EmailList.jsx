import React from 'react';
import { Paperclip, Mail, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EmailList({ emails, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Mail className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No emails found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {emails.map((email) => {
        const isSelected = selectedId === email.id;
        const isUnread = !email.isRead;
        return (
          <button
            key={email.id}
            onClick={() => onSelect(email)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3',
              isSelected && 'bg-primary/5 border-l-2 border-primary',
              isUnread && 'font-semibold'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={cn('text-sm truncate', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                  {email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(email.receivedDateTime)}</span>
              </div>
              <p className={cn('text-sm truncate', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                {email.subject || '(No subject)'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{email.bodyPreview}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {email.hasAttachments && <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
            </div>
          </button>
        );
      })}
    </div>
  );
}