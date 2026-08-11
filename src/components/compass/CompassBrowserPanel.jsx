import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Globe, RefreshCw, AlertTriangle } from 'lucide-react';

const DEFAULT_URL = 'https://csscm.alberta.ca/home';

export default function CompassBrowserPanel() {
  const [address, setAddress] = useState(DEFAULT_URL);
  const [loadedUrl, setLoadedUrl] = useState('');
  const [showBlockedHint, setShowBlockedHint] = useState(false);

  const go = () => {
    const url = address.trim();
    if (!url) return;
    setLoadedUrl(url);
    setShowBlockedHint(true);
  };

  const reload = () => {
    if (loadedUrl) {
      // Toggling src forces a reload even if the same URL is re-entered.
      setLoadedUrl('');
      setTimeout(() => setLoadedUrl(address.trim()), 50);
    } else {
      go();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white overflow-hidden">
      {/* Address bar */}
      <div className="flex items-center gap-2 p-2 border-b bg-slate-50">
        <Globe className="h-4 w-4 text-slate-500 shrink-0" />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="Enter URL"
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" onClick={go} className="h-8">Go to page</Button>
        <Button size="sm" variant="outline" onClick={reload} className="h-8" title="Reload">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8" title="Open in new tab">
          <a href={address.trim() || DEFAULT_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      {/* Browser viewport */}
      <div className="relative flex-1 min-h-[420px] bg-white">
        {loadedUrl ? (
          <iframe
            src={loadedUrl}
            title="Compass Browser"
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Globe className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-2">Press <span className="font-semibold">Go to page</span> to load the Compass login.</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Default home page: <span className="font-mono">{DEFAULT_URL}</span>
            </p>
          </div>
        )}

        {/* Blocked-embed hint overlay (shown alongside the iframe, not replacing it) */}
        {showBlockedHint && loadedUrl && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-50/95 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800 flex items-start gap-2 pointer-events-none">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Page blank or “refused to connect”? This site blocks embedding. Use{' '}
              <a href={loadedUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold pointer-events-auto">Open in new tab</a>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}