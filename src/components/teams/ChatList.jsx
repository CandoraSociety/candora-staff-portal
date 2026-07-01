import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function getChatDisplayName(chat, profile) {
  if (chat.topic) return chat.topic;
  const myEmail = (profile?.mail || profile?.userPrincipalName || '').toLowerCase();
  const others = (chat.members || []).filter(m =>
    !(m.email && m.email.toLowerCase() === myEmail)
  );
  if (others.length > 0) return others.map(m => m.displayName || m.email || 'Unknown').join(', ');
  return 'Direct chat';
}

export default function ChatList({ chats, loading, onSelect, profile }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No chats found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto h-full">
      {chats.map((chat) => {
        const preview = chat.lastMessagePreview?.body?.content;
        return (
          <button
            key={chat.id}
            onClick={() => onSelect(chat)}
            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {getChatDisplayName(chat, profile)}
                </span>
                {chat.lastUpdatedDateTime && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(chat.lastUpdatedDateTime)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {preview ? stripHtml(preview) : 'No messages yet'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}