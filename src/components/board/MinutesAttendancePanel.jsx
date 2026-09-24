import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Plus, UserPlus, X } from "lucide-react";

// Pre-loaded permanent board member list (displayed alphabetically)
export const SEED_BOARD_MEMBERS = [
  { full_name: "Janice Theriault", role: "Chair" },
  { full_name: "Zachary Schopf", role: "Secretary" },
  { full_name: "Candace Noble", role: "Vice-Chair" },
  { full_name: "David Bunmi-Nathan", role: "Treasurer" },
  { full_name: "Melanie Lang", role: "Director" },
  { full_name: "Chaya McLauchlin", role: "Director" },
  { full_name: "Ron Fernandes", role: "Director" },
  { full_name: "Graham Currie", role: "ED" },
];

const MEMBER_ROLES = ["Chair", "Vice-Chair", "Treasurer", "Secretary", "Director", "ED", "Observer"];
export const ROLE_LABELS = { ED: "Executive Director", "Vice-Chair": "Vice Chair" };

export function memberEmail(name) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@board.candora`;
}

export default function MinutesAttendancePanel({ members, presentNames, guestNames, onToggleMember, onAddGuest, onRemoveGuest, onMemberAdded }) {
  const [guestInput, setGuestInput] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: "", role: "Director" });
  const [adding, setAdding] = useState(false);

  const addGuest = (e) => {
    e.preventDefault();
    const name = guestInput.trim();
    if (!name) return;
    onAddGuest(name);
    setGuestInput("");
  };

  const addMember = async (e) => {
    e.preventDefault();
    const name = newMember.full_name.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const saved = await base44.entities.BoardMember.create({ full_name: name, role: newMember.role, email: memberEmail(name), status: "active" });
      onMemberAdded(saved);
      setNewMember({ full_name: "", role: "Director" });
      setShowAddMember(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance</h2>
        <span className="text-xs text-muted-foreground">{presentNames.length + guestNames.length} present</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-1.5">
        {members.map((m) => {
          const present = presentNames.includes(m.full_name);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggleMember(m.full_name, !present)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition ${present ? "border-primary/50 bg-primary/10" : "border-border bg-background hover:border-primary/30"}`}
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${present ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                {present && <Check size={10} />}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm text-foreground">{m.full_name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{ROLE_LABELS[m.role] || m.role}</span>
            </button>
          );
        })}
      </div>

      {/* Guests */}
      <div className="mt-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {guestNames.map((g) => (
            <span key={g} className="inline-flex items-center gap-1 text-xs bg-secondary rounded-full pl-2.5 pr-1.5 py-1">
              {g}
              <button type="button" onClick={() => onRemoveGuest(g)} className="text-muted-foreground hover:text-destructive"><X size={11} /></button>
            </span>
          ))}
        </div>
        <form onSubmit={addGuest} className="flex gap-2">
          <input value={guestInput} onChange={(e) => setGuestInput(e.target.value)} placeholder="Add guest name…" className="flex-1 border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none" />
          <button type="submit" className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition">
            <Plus size={12} /> Guest
          </button>
        </form>
      </div>

      {/* Add to permanent list */}
      <div className="mt-3 pt-3 border-t border-border">
        {!showAddMember ? (
          <button type="button" onClick={() => setShowAddMember(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <UserPlus size={12} /> Add to permanent list
          </button>
        ) : (
          <form onSubmit={addMember} className="flex flex-wrap gap-2 items-center">
            <input value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} placeholder="Name" autoFocus required className="flex-1 min-w-[140px] border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none" />
            <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
              {MEMBER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
            </select>
            <button type="submit" disabled={adding} className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
              <Plus size={12} /> Add
            </button>
            <button type="button" onClick={() => setShowAddMember(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
}