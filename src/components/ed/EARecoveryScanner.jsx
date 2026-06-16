import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";

export default function RecoveryScanner({ onRestore, headerMode }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);

  const scan = () => {
    const found = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (!val) continue;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.role && parsed[0]?.content) {
            found.push({ key, messages: parsed, count: parsed.length });
          }
        } catch {}
      }
    } catch {}
    setResults(found);
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(o => !o);
    if (!open) scan();
  };

  if (headerMode) {
    return (
      <div className="relative">
        <button
          onClick={handleOpen}
          className="p-1.5 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "hsl(230,30%,60%)" }}
          title="Recover saved conversation"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 top-8 z-50 rounded-xl shadow-2xl p-3 w-72 space-y-2"
              style={{ background: "hsl(230,65%,11%)", border: "1px solid hsl(230,45%,22%)" }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs font-semibold" style={{ color: "hsl(45,70%,75%)" }}>Recover Conversation</p>
              {results === null ? (
                <p className="text-xs" style={{ color: "hsl(230,30%,55%)" }}>Scanning...</p>
              ) : results.length === 0 ? (
                <p className="text-xs" style={{ color: "hsl(230,30%,55%)" }}>No saved conversations found in your browser storage.</p>
              ) : (
                results.map((r) => (
                  <div key={r.key} className="rounded-lg p-2.5 space-y-1.5" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
                    <p className="text-[10px] font-mono" style={{ color: "hsl(230,30%,55%)" }}>{r.key}</p>
                    <p className="text-xs" style={{ color: "hsl(45,50%,80%)" }}>
                      {r.count} messages · "{r.messages[r.messages.length - 1]?.content?.slice(0, 50)}..."
                    </p>
                    <button
                      onClick={() => { onRestore(r.messages); setOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold w-full justify-center hover:opacity-80"
                      style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore ({r.count} messages)
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Inline mode (shown in empty chat)
  return (
    <div className="w-full space-y-2">
      {results === null ? (
        <button
          onClick={() => scan()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-70"
          style={{ color: "hsl(230,30%,55%)", border: "1px solid hsl(230,45%,22%)" }}
        >
          <Search className="w-3 h-3" />
          Search for saved conversations
        </button>
      ) : results.length === 0 ? (
        <p className="text-xs text-center" style={{ color: "hsl(230,30%,50%)" }}>No conversation data found in browser storage.</p>
      ) : (
        results.map((r) => (
          <div key={r.key} className="rounded-xl p-3 space-y-2" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
            <p className="text-xs" style={{ color: "hsl(45,50%,80%)" }}>{r.count} messages found</p>
            <button
              onClick={() => onRestore(r.messages)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold w-full justify-center hover:opacity-80"
              style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Restore ({r.count} messages)
            </button>
          </div>
        ))
      )}
    </div>
  );
}