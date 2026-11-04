import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import RcAssistantChat from '@/components/rc/RcAssistantChat';

// "Ask the database" assistant, opened from a button in the portal header.
// On a client file it already knows which client is open.
export default function RcAssistantHeaderButton({ portal = 'rc' }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const match = location.pathname.match(/(?:\/rc\/clients|\/rworker\/clients)\/([^/]+)/);
  const focusClientId = match ? match[1] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        title={portal === 'rworker' ? 'Ask the casework assistant' : 'Ask the database assistant'}
      >
        <Sparkles className="h-4 w-4" style={{ color: 'hsl(45,92%,53%)' }} />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-[9998] w-[calc(100vw-2rem)] sm:w-[460px] max-w-[460px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-card flex flex-col"
            style={{ height: 'min(560px, calc(100vh - 8rem))' }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-sidebar text-sidebar-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-display font-bold leading-tight truncate">
                    {portal === 'rworker' ? 'Casework Assistant' : 'Database Assistant'}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/60 leading-tight truncate">
                    {portal === 'rworker' ? 'Your clients · read only' : 'All client files · read only'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground" title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-card">
              <RcAssistantChat portal={portal} focusClientId={focusClientId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}