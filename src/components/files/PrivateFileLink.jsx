import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { resolveFileUrl } from '@/lib/privateFiles';

// Opens a privately stored client document. The tab is opened on the click
// itself and pointed at the short-lived link once it arrives, so the browser
// never treats it as a pop-up.
export default function PrivateFileLink({ file, label = 'Document', className = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    if (busy) return;
    const tab = window.open('', '_blank');
    if (!tab) {
      setError('Allow pop-ups for this site to open documents.');
      return;
    }
    tab.opener = null;
    setBusy(true);
    setError('');
    try {
      const url = await resolveFileUrl(file);
      if (url) tab.location.replace(url);
      else tab.close();
    } catch (e) {
      tab.close();
      setError('This document could not be opened.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="min-w-0 flex-1">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={`flex items-center gap-1.5 text-sm text-blue-600 hover:underline truncate ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </button>
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </span>
  );
}