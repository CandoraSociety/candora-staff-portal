import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, ChevronDown } from "lucide-react";

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

export const EMPTY_POS = {
  title: "", person_name: "", department: "", departments: [],
  tier: "", reports_to_id: "", salary: "", is_vacant: false, notes: "",
  team_ids: []
};

// Autocomplete input with dropdown suggestions
function AutocompleteInput({ value, onChange, suggestions, placeholder, className }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || "");
  const ref = useRef(null);

  useEffect(() => { setInputVal(value || ""); }, [value]);

  const filtered = useMemo(() =>
    suggestions.filter(s => s.toLowerCase().includes(inputVal.toLowerCase()) && s !== inputVal),
    [suggestions, inputVal]
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <Input
        placeholder={placeholder}
        value={inputVal}
        onChange={e => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              onMouseDown={e => { e.preventDefault(); setInputVal(s); onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-select with autocomplete for departments
function DepartmentMultiSelect({ selected, onChange, suggestions }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const ref = useRef(null);

  const filtered = useMemo(() =>
    suggestions.filter(s => s.toLowerCase().includes(inputVal.toLowerCase()) && !selected.includes(s)),
    [suggestions, inputVal, selected]
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addDept = (dept) => {
    const trimmed = dept.trim();
    if (trimmed && !selected.includes(trimmed)) onChange([...selected, trimmed]);
    setInputVal("");
  };

  const removeDept = (dept) => onChange(selected.filter(d => d !== dept));

  return (
    <div ref={ref} className="relative">
      <div
        className="min-h-9 border border-input rounded-md px-2 py-1 flex flex-wrap gap-1 items-center cursor-text bg-transparent"
        onClick={() => { setOpen(true); }}
      >
        {selected.map(d => (
          <span key={d} className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs">
            {d}
            <button onMouseDown={e => { e.preventDefault(); removeDept(d); }}><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
          placeholder={selected.length === 0 ? "Select or type departments..." : "Add more..."}
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === "Enter" && inputVal.trim()) { e.preventDefault(); addDept(inputVal); } }}
        />
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>
      {open && (filtered.length > 0 || inputVal.trim()) && (
        <div className="absolute z-50 w-full mt-1 border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
              onMouseDown={e => { e.preventDefault(); addDept(s); setOpen(false); }}
            >
              <Check className="w-3.5 h-3.5 opacity-0" />
              {s}
            </button>
          ))}
          {inputVal.trim() && !suggestions.includes(inputVal.trim()) && (
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors text-accent"
              onMouseDown={e => { e.preventDefault(); addDept(inputVal); setOpen(false); }}
            >
              + Add "{inputVal.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Team multi-select (checkbox style)
function TeamMultiSelect({ selected, onChange, teams }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const selectedNames = teams.filter(t => selected.includes(t.id)).map(t => t.name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="w-full min-h-9 border border-input rounded-md px-3 py-1.5 text-sm text-left flex items-center justify-between gap-2 bg-transparent hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex flex-wrap gap-1 flex-1">
          {selectedNames.length === 0
            ? <span className="text-muted-foreground">Select teams...</span>
            : selectedNames.map(n => (
              <span key={n} className="bg-primary/10 text-primary-foreground/80 rounded-full px-2 py-0.5 text-xs bg-accent/10 text-accent">{n}</span>
            ))
          }
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
          {teams.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No teams yet — create them in the Teams tab.</p>}
          {teams.map(t => (
            <button
              key={t.id}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
              onMouseDown={e => { e.preventDefault(); toggle(t.id); }}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected.includes(t.id) ? "bg-accent border-accent" : "border-muted-foreground/40"}`}>
                {selected.includes(t.id) && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
              </div>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color || "#6366f1" }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPositionForm({ open, onOpenChange, form, setForm, onSave, editId, positions }) {
  // Load all existing positions to derive title/department suggestions
  const { data: allPositions = [] } = useQuery({
    queryKey: ["ed-org"],
    queryFn: () => base44.entities.EDOrgPosition.list(),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["ed-org-teams"],
    queryFn: () => base44.entities.EDOrgTeam.list(),
  });

  // Derive unique titles and departments from all saved positions
  const titleSuggestions = useMemo(() =>
    [...new Set(allPositions.map(p => p.title).filter(Boolean))],
    [allPositions]
  );
  const deptSuggestions = useMemo(() => {
    const all = allPositions.flatMap(p => p.departments?.length ? p.departments : (p.department ? [p.department] : []));
    return [...new Set(all.filter(Boolean))];
  }, [allPositions]);

  // When departments change, auto-suggest teams whose names match a department
  const handleDepartmentsChange = (newDepts) => {
    // Find teams whose names match any selected department (case-insensitive)
    const autoTeamIds = teams
      .filter(t => newDepts.some(d => t.name.toLowerCase() === d.toLowerCase()))
      .map(t => t.id);
    // Merge with manually selected teams (don't remove ones user added manually)
    const currentManual = (form.team_ids || []).filter(id => {
      const team = teams.find(t => t.id === id);
      if (!team) return false;
      // Keep if it doesn't match any old department auto-assignment
      return true;
    });
    const merged = [...new Set([...currentManual, ...autoTeamIds])];
    setForm({ ...form, departments: newDepts, department: newDepts[0] || "", team_ids: merged });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editId ? "Edit Position" : "Add Position"}</DialogTitle></DialogHeader>
        <div className="space-y-3">

          {/* Job Title — autocomplete from existing titles */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Job Title</label>
            <AutocompleteInput
              value={form.title}
              onChange={v => setForm({ ...form, title: v })}
              suggestions={titleSuggestions}
              placeholder="Job title"
            />
          </div>

          <Input
            placeholder="Person name (leave blank if vacant)"
            value={form.person_name || ""}
            onChange={e => setForm({ ...form, person_name: e.target.value })}
          />

          {/* Departments — multi-select with autocomplete */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Department(s)</label>
            <DepartmentMultiSelect
              selected={form.departments || (form.department ? [form.department] : [])}
              onChange={handleDepartmentsChange}
              suggestions={deptSuggestions}
            />
          </div>

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

          {/* Teams — auto-populated from departments, but fully editable */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Teams <span className="text-muted-foreground/50">(auto-suggested from departments — edit freely)</span>
            </label>
            <TeamMultiSelect
              selected={form.team_ids || []}
              onChange={ids => setForm({ ...form, team_ids: ids })}
              teams={teams}
            />
          </div>

          <Input
            type="number"
            placeholder="Annual salary"
            value={form.salary || ""}
            onChange={e => setForm({ ...form, salary: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_vacant} onCheckedChange={v => setForm({ ...form, is_vacant: v })} />
            <span className="text-sm">Mark as vacant</span>
          </div>
          <Input
            placeholder="Notes"
            value={form.notes || ""}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}