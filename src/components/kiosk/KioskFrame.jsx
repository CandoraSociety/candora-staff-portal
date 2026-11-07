import React from 'react';
import { X } from 'lucide-react';

// Shared kiosk card: big title, big body, and the tablet's back-out control.
export default function KioskFrame({ prompt, icon: Icon, onClose, children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-sidebar px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="h-12 w-12 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-sidebar-foreground font-display font-bold text-2xl leading-tight">{prompt.title}</h1>
            {prompt.message && <p className="text-sidebar-foreground/70 mt-1">{prompt.message}</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-sidebar-foreground/50 hover:text-sidebar-foreground p-2" aria-label="Cancel">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">{children}</div>
      </div>
    </div>
  );
}