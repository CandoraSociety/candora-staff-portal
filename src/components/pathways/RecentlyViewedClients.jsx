import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

const STORAGE_KEY = "pathways_recent_clients";
const MAX = 3;

export function recordRecentClient(client) {
  try {
    const entry = {
      id: client.id,
      name: `${client.first_name || ""} ${client.last_name || ""}`.trim(),
      hsid: client.compass_hsid || "",
      ts: Date.now(),
    };
    let list = [];
    try { list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch {}
    list = list.filter(c => c.id !== entry.id);
    list.unshift(entry);
    list = list.slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export default function RecentlyViewedClients() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); } catch { setItems([]); }
  }, []);
  if (!items.length) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recently Viewed</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(`/pathways/client/${c.id}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm shadow-sm"
          >
            <span className="font-medium text-slate-800">{c.name}</span>
            {c.hsid
              ? <span className="text-xs text-slate-400">HSID: {c.hsid}</span>
              : <span className="text-xs text-slate-300 italic">No HSID</span>}
          </button>
        ))}
      </div>
    </div>
  );
}