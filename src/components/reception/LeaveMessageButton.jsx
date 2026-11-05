import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import LeaveMessageDialog from '@/components/reception/LeaveMessageDialog';

// Header button for the front desk: leave a timestamped message that lands in
// a staff member's dashboard notifications.
export default function LeaveMessageButton({ fromName, onDark = false, className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Leave a message for a staff member"
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
          onDark
            ? 'border border-sidebar-border text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            : 'border border-input text-foreground hover:bg-muted',
          className
        )}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Leave a message</span>
      </button>
      <LeaveMessageDialog open={open} onOpenChange={setOpen} fromName={fromName} />
    </>
  );
}