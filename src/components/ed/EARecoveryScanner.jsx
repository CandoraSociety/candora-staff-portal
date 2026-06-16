import { useState } from "react";
import { Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Scans localStorage for any saved EA conversation data and lets the user restore it.
 */
export default function RecoveryScanner({ onRestore }) {
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const scan = () => {
    const found = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (!val) continue;
        // Look for anything that looks like a chat messages array
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.role && parsed[0]?.content) {
            found.push({ key, messages: parsed, count: parsed.length });
          }
        } catch {}
      }
    } catch {}
    setResults(found);
    setExpanded(true);
  };

  return (
    <div className="w-full">
      {!results ? (
        <button
          onClick={scan}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-70"
          style={{ color: "hsl(230,30%,55%)", border: "1px solid hsl(230,45%,22%)" }}
        >
          <Search className="w-3 h-3" />
          Search for saved conversations
        </button>
      ) : (
        <div className="w-full space-y-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs w-full justify-center"
            style={{ color: "hsl(230,30%,55%)" }}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {results.length === 0 ? "No saved conversations found" : `Found ${results.length} saved conversation${results.length > 1 ? "s" : ""}`}
          </button>
          {expanded && results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.key}
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}
                >
                  <div>
                    <p className="text-[10px] font-mono" style={{ color: "hsl(230,30%,55%)" }}>{r.key}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(45,50%,80%)" }}>
                      {r.count} messages · Last: "{r.messages[r.messages.length - 1]?.content?.slice(0, 60)}..."
                    </p>
                  </div>
                  <button
                    onClick={() => onRestore(r.messages)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80 w-full justify-center"
                    style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore this conversation ({r.count} messages)
                  </button>
                </div>
              ))}
            </div>
          )}
          {expanded && results.length === 0 && (
            <p className="text-xs text-center" style={{ color: "hsl(230,30%,50%)" }}>
              No conversation data was found in your browser storage. It may have been cleared.
            </p>
          )}
        </div>
      )}
    </div>
  );
}