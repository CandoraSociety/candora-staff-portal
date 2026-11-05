import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNewMail } from '@/lib/newMailAlerts';

const timeLabel = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function NewMailBell() {
  const { newMessages, clear, muted, toggleMuted } = useNewMail();
  const navigate = useNavigate();
  const count = newMessages.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="New email">
          <Mail className="w-5 h-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          {count > 0 ? `${count} new email${count > 1 ? 's' : ''}` : 'New email'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No new email right now.</p>
        ) : (
          newMessages.slice(0, 5).map((message) => (
            <DropdownMenuItem
              key={message.id}
              className="flex-col items-start gap-0.5 py-2"
              onClick={() => navigate('/outlook')}
            >
              <span className="text-sm font-medium truncate w-full">
                {message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown sender'}
              </span>
              <span className="text-xs text-muted-foreground truncate w-full">
                {message.subject || '(no subject)'}
              </span>
              <span className="text-[10px] text-muted-foreground">{timeLabel(message.receivedDateTime)}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/outlook')}>Open Outlook</DropdownMenuItem>
        <DropdownMenuItem onClick={toggleMuted}>
          {muted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
          {muted ? 'Turn alert sound on' : 'Turn alert sound off'}
        </DropdownMenuItem>
        {count > 0 && <DropdownMenuItem onClick={clear}>Dismiss alerts</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}