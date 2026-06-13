import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, User, UserX, DollarSign } from "lucide-react";

const EMPTY = { title: "", person_name: "", department: "", reports_to_id: "", salary: "", is_vacant: false, notes: "" };

function OrgNode({ position, all, depth = 0, onEdit, onDelete }) {
  const children = all.filter(p => p.reports_to_id === position.id);
  const branchSalary = (function sum(pos) {
    const kids = all.filter(p => p.reports_to_id === pos.id);
    return (pos.salary || 0) + kids.reduce((s, c) => s + sum(c), 0);
  })(position);

  return (
    <div className="flex flex-col items-center">
      <div className={`group relative p-3 rounded-xl border-2 min-w-[140px] max-w-[180px] text-center ${position.is_vacant ? "border-dashed border-muted-foreground/40 bg-muted/20" : "border-border bg-card shadow-sm"}`}>
        <div className="flex justify-center mb-1">
          {position.is_vacant ? <UserX className="w-6 h-6 text-muted-foreground/50" /> : <User className="w-6 h-6 text-accent" />}
        </div>
        <p className="text-xs font-semibold leading-tight">{position.title}</p>
        {position.person_name && <p className="text-xs text-muted-foreground">{position.person_name}</p>}
        {position.department && <p className="text-xs text-muted-foreground/70">{position.department}</p>}
        {position.is_vacant && <Badge variant="outline" className="text-xs mt-1">Vacant</Badge>}
        {position.salary > 0 && <p className="text-xs text-muted-foreground mt-0.5">${position.salary.toLocaleString()}</p>}
        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onEdit(position)}>
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onDelete(position.id)}>
            <Trash2 className="w-2.5 h-2.5 text-destructive" />
          </button>
        </div>
        {children.length > 0 && (
          <p className="text-xs text-muted-foreground/60 mt-1 flex items-center justify-center gap-0.5">
            <DollarSign className="w-2.5 h-2.5" />{branchSalary.toLocaleString()}
          </p>
        )}
      </div>

      {children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-6 items-start relative">
            {children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-border" />
            )}
            {children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNode position={child} all={all} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EDOrgChart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const { data: positions = [] } = useQuery({ queryKey: ["ed-org"], queryFn: () => base44.entities.EDOrgPosition.list() });

  const save = async () => {
    if (!form.title.trim()) return;
    const data = { ...form, salary: parseFloat(form.salary) || 0 };
    if (editId) await base44.entities.EDOrgPosition.update(editId, data);
    else await base44.entities.EDOrgPosition.create({ ...data, owner_id: user?.id });
    qc.invalidateQueries({ queryKey: ["ed-org"] });
    setOpen(false); setForm(EMPTY); setEditId(null);
  };

  const del = async (id) => { await base44.entities.EDOrgPosition.delete(id); qc.invalidateQueries({ queryKey: ["ed-org"] }); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p.id); setOpen(true); };

  const roots = positions.filter(p => !p.reports_to_id || !positions.find(x => x.id === p.reports_to_id));
  const totalSalary = positions.reduce((s, p) => s + (p.salary || 0), 0);

  return (
    <div className="p-6 space-y-4 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Org Chart</h1>
          {positions.length > 0 && <p className="text-sm text-muted-foreground">Total payroll: ${totalSalary.toLocaleString()} · {positions.length} positions ({positions.filter(p => p.is_vacant).length} vacant)</p>}
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Position
        </Button>
      </div>

      {positions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No positions yet.</p>}

      <div className="overflow-x-auto pb-6">
        <div className="flex gap-12 justify-center min-w-max pt-4">
          {roots.map(r => <OrgNode key={r.id} position={r} all={positions} onEdit={openEdit} onDelete={del} />)}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Position" : "Add Position"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Job title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Person name (leave blank if vacant)" value={form.person_name} onChange={e => setForm({ ...form, person_name: e.target.value })} />
            <Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Reports To</label>
              <Select value={form.reports_to_id || "none"} onValueChange={v => setForm({ ...form, reports_to_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="No reporting relationship" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {positions.filter(p => p.id !== editId).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title} {p.person_name ? `(${p.person_name})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input type="number" placeholder="Annual salary" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            <div className="flex items-center gap-2">
              <Switch checked={form.is_vacant} onCheckedChange={v => setForm({ ...form, is_vacant: v })} />
              <span className="text-sm">Mark as vacant</span>
            </div>
            <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}