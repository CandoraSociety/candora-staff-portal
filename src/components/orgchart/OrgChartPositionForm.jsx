import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIERS = [
  { value: "executive", label: "Executive" },
  { value: "director", label: "Director" },
  { value: "senior_manager", label: "Senior Manager" },
  { value: "manager", label: "Manager" },
  { value: "supervisor_team_lead", label: "Supervisor / Team Lead" },
  { value: "frontline", label: "Frontline" },
  { value: "assistant", label: "Assistant" },
  { value: "practicum_placement", label: "Practicum Placement" },
  { value: "specialist", label: "Specialist" },
];

export const EMPTY_POS = { title: "", person_name: "", department: "", tier: "", reports_to_id: "", salary: "", is_vacant: false, notes: "" };

export default function OrgChartPositionForm({ open, onOpenChange, form, setForm, onSave, editId, positions }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editId ? "Edit Position" : "Add Position"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Job title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Person name (leave blank if vacant)" value={form.person_name || ""} onChange={e => setForm({ ...form, person_name: e.target.value })} />
          <Input placeholder="Department" value={form.department || ""} onChange={e => setForm({ ...form, department: e.target.value })} />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tier</label>
            <Select value={form.tier || "none"} onValueChange={v => setForm({ ...form, tier: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No tier —</SelectItem>
                {TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Reports To</label>
            <Select value={form.reports_to_id || "none"} onValueChange={v => setForm({ ...form, reports_to_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="No reporting relationship" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {(positions || []).filter(p => p.id !== editId).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}{p.person_name ? ` (${p.person_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input type="number" placeholder="Annual salary" value={form.salary || ""} onChange={e => setForm({ ...form, salary: e.target.value })} />
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_vacant} onCheckedChange={v => setForm({ ...form, is_vacant: v })} />
            <span className="text-sm">Mark as vacant</span>
          </div>
          <Input placeholder="Notes" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}