import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import RcAssistantChat from '@/components/rc/RcAssistantChat';

// Floating "ask the database" chat for the Central Database and Resource Worker
// portals. On a client file it already knows which client you are looking at.
export default function RcAssistantWidget({ portal = 'rc' }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const match = location.pathname.match(/(?:\/rc\/clients|\/rworker\/clients)\/([^/]+)/);
  const focusClientId = match ? match[1] : null;

  return (
    <>
      {open && (
        <div
          className="fixed z-[9998] bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-card flex flex-col"
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
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed z-[9998] bottom-6 right-4 sm:right-6 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          height: 56,
          width: 56,
          background: open ? 'hsl(230,70%,15%)' : 'linear-gradient(135deg, hsl(45,92%,53%), hsl(35,95%,60%))',
          border: '2px solid hsl(45,92%,53%)',
        }}
        title="Ask the database"
      >
        {open
          ? <X className="h-6 w-6" style={{ color: 'hsl(45,92%,53%)' }} />
          : <Sparkles className="h-6 w-6" style={{ color: 'hsl(230,70%,10%)' }} />}
      </button>
    </>
  );
}