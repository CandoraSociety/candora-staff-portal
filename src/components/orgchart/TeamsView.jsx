import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, User, UserX, Crown } from "lucide-react";

const TEAM_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

export default function TeamsView({ positions, currentUser }) {
  const qc = useQueryClient();
  const { data: teams = [] } = useQuery({
    queryKey: ["ed-org-teams"],
    queryFn: () => base44.entities.EDOrgTeam.list(),
  });

  const [dialog, setDialog] = useState(null); // null | { mode: "new"|"edit", team? }
  const [form, setForm] = useState({ name: "", description: "", color: TEAM_COLORS[0], member_position_ids: [], lead_position_id: "" });

  const openNew = () => {
    setForm({ name: "", description: "", color: TEAM_COLORS[teams.length % TEAM_COLORS.length], member_position_ids: [], lead_position_id: "" });
    setDialog({ mode: "new" });
  };
  const openEdit = (team) => {
    setForm({ name: team.name, description: team.description || "", color: team.color || TEAM_COLORS[0], member_position_ids: team.member_position_ids || [], lead_position_id: team.lead_position_id || "" });
    setDialog({ mode: "edit", team });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
      member_position_ids: form.member_position_ids,
      lead_position_id: form.lead_position_id || null,
      owner_id: currentUser?.id,
    };
    if (dialog.mode === "new") {
      await base44.entities.EDOrgTeam.create(payload);
    } else {
      await base44.entities.EDOrgTeam.update(dialog.team.id, payload);
    }
    qc.invalidateQueries({ queryKey: ["ed-org-teams"] });
    setDialog(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.EDOrgTeam.delete(id);
    qc.invalidateQueries({ queryKey: ["ed-org-teams"] });
  };

  const toggleMember = (posId) => {
    setForm(prev => {
      const isSelected = prev.member_position_ids.includes(posId);
      const updated = isSelected
        ? prev.member_position_ids.filter(x => x !== posId)
        : [...prev.member_position_ids, posId];
      return { ...prev, member_position_ids: updated };
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <p className="text-sm text-muted-foreground">Teams allow you to group people across the org chart. People can belong to multiple teams.</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Team</Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {teams.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No teams yet. Create one to group positions across departments.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map(team => {
            // Membership comes from BOTH sources: the team's own member_position_ids
            // AND positions that have this team's id in their team_ids array
            const memberIds = new Set([
              ...(team.member_position_ids || []),
              ...positions.filter(p => (p.team_ids || []).includes(team.id)).map(p => p.id),
            ]);
            const lead = positions.find(p => p.id === team.lead_position_id);
            const members = positions.filter(p => memberIds.has(p.id) && p.id !== team.lead_position_id);
            return (
              <div key={team.id} className="border rounded-xl p-4 bg-card shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: team.color || "#6366f1" }} />
                    <h3 className="font-semibold text-sm">{team.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-muted transition-colors" onClick={() => openEdit(team)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" onClick={() => handleDelete(team.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
                {team.description && <p className="text-xs text-muted-foreground mb-3">{team.description}</p>}
                {lead && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="font-medium">{lead.person_name || lead.title}</span>
                    <span className="text-muted-foreground/60">— Lead</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {members.length === 0 && !lead && <span className="text-xs text-muted-foreground/50 italic">No members yet</span>}
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5">
                      {m.is_vacant ? <UserX className="w-3 h-3 text-muted-foreground/50" /> : <User className="w-3 h-3 text-accent" />}
                      <span className="text-xs">{m.person_name || m.title}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-2">{memberIds.size} member{memberIds.size !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team edit dialog */}
      <Dialog open={!!dialog} onOpenChange={v => !v && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog?.mode === "new" ? "New Team" : "Edit Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Team name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Team colour</label>
              <div className="flex gap-2 flex-wrap">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Members <span className="text-muted-foreground/50">(select all that apply — people can be on multiple teams)</span></label>
              <div className="max-h-52 overflow-y-auto space-y-1 border rounded-lg p-2">
                {positions.map(p => (
                  <label key={p.id} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted cursor-pointer">
                    <input type="checkbox" checked={form.member_position_ids.includes(p.id)} onChange={() => toggleMember(p.id)} />
                    <span className="text-sm flex-1">{p.title}{p.person_name ? ` — ${p.person_name}` : ""}</span>
                    {form.lead_position_id === p.id && <Crown className="w-3 h-3 text-amber-500" />}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Team Lead</label>
              <select
                className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
                value={form.lead_position_id}
                onChange={e => setForm({ ...form, lead_position_id: e.target.value })}
              >
                <option value="">— No lead assigned —</option>
                {positions.filter(p => form.member_position_ids.includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.title}{p.person_name ? ` (${p.person_name})` : ""}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}