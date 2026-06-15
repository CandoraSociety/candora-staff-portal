import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  tier: "", row_number: "", reports_to_id: null, dotted_line_reports_to_id: null, 
  salary: "", hourly_rate: "", hours_per_week: "", weeks_per_year: "",
  has_summer_hours: false, summer_hours_per_week: "", summer_weeks: "",
  is_vacant: false, notes: "",
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
  const qc = useQueryClient();
  // Load all existing positions to derive title/department suggestions
  const { data: allPositions = [] } = useQuery({
    queryKey: ["ed-org"],
    queryFn: () => base44.entities.EDOrgPosition.list(),
  });
  const { data: teams = [], refetch: refetchTeams } = useQuery({
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
    return [...new Set(all.filter(Boolean).map(d =>
      d.toLowerCase().includes("employment") && d.toLowerCase().includes("social enterprise") ? "Social Enterprise" : d
    ))];
  }, [allPositions]);

  // Normalize dept name helper
  const normalizeDept = (d) =>
    d.toLowerCase().includes("employment") && d.toLowerCase().includes("social enterprise") ? "Social Enterprise" : d;

  // Auto-calculate annual salary from hourly rate × hours/week × weeks/year (with optional summer hours)
  useEffect(() => {
    if (form.hourly_rate && form.hours_per_week && form.weeks_per_year) {
      const hourly = parseFloat(form.hourly_rate);
      const regularHours = parseFloat(form.hours_per_week);
      const regularWeeks = parseFloat(form.weeks_per_year);
      
      let annual = hourly * regularHours * regularWeeks;
      
      // Add summer hours calculation if enabled
      if (form.has_summer_hours && form.summer_hours_per_week && form.summer_weeks) {
        const summerHours = parseFloat(form.summer_hours_per_week);
        const summerWeeks = parseFloat(form.summer_weeks);
        annual += hourly * summerHours * summerWeeks;
      }
      
      setForm(prev => ({ ...prev, salary: Math.round(annual) }));
    }
  }, [form.hourly_rate, form.hours_per_week, form.weeks_per_year, form.has_summer_hours, form.summer_hours_per_week, form.summer_weeks]);

  // Sync teams with departments when form opens or departments change
  useEffect(() => {
    if (!open || teams.length === 0) return;
    const depts = form.departments || (form.department ? [form.department] : []);
    if (depts.length === 0) return;

    const matchingTeamIds = teams
      .filter(t => depts.some(d => t.name.toLowerCase() === d.toLowerCase()))
      .map(t => t.id);

    // Only update if there are matching teams not already in team_ids
    const current = form.team_ids || [];
    const missing = matchingTeamIds.filter(id => !current.includes(id));
    if (missing.length > 0) {
      setForm({ ...form, team_ids: [...new Set([...current, ...missing])] });
    }
  }, [open, teams.length]);

  // On save: create any missing teams for new departments, then call onSave with updated team_ids
  const handleSave = async () => {
    const depts = form.departments || (form.department ? [form.department] : []);
    let currentTeams = teams;
    let teamIds = [...(form.team_ids || [])];

    for (const dept of depts) {
      const exists = currentTeams.find(t => t.name.toLowerCase() === dept.toLowerCase());
      if (!exists) {
        const created = await base44.entities.EDOrgTeam.create({ name: dept });
        currentTeams = [...currentTeams, created];
        qc.invalidateQueries({ queryKey: ["ed-org-teams"] });
        if (!teamIds.includes(created.id)) teamIds.push(created.id);
      } else if (!teamIds.includes(exists.id)) {
        teamIds.push(exists.id);
      }
    }

    // Recompute salary from hourly fields at save time so we don't rely on useEffect timing
    let computedSalary = parseFloat(form.salary) || 0;
    const hourly = parseFloat(form.hourly_rate);
    const hoursPerWeek = parseFloat(form.hours_per_week);
    const weeksPerYear = parseFloat(form.weeks_per_year);
    if (hourly > 0 && hoursPerWeek > 0 && weeksPerYear > 0) {
      computedSalary = Math.round(hourly * hoursPerWeek * weeksPerYear);
      if (form.has_summer_hours) {
        const summerHours = parseFloat(form.summer_hours_per_week) || 0;
        const summerWeeks = parseFloat(form.summer_weeks) || 0;
        if (summerHours > 0 && summerWeeks > 0) {
          computedSalary += Math.round(hourly * summerHours * summerWeeks);
        }
      }
    }

    // Auto-set is_vacant if no person name provided
    const isVacant = form.is_vacant || !form.person_name?.trim();

    onSave({ ...form, team_ids: teamIds, salary: computedSalary, is_vacant: isVacant });
  };

  // When departments change:
  // - add the matching team when a dept is selected
  // - remove the matching team when a dept is removed (unless manually kept)
  const handleDepartmentsChange = (newDepts) => {
    const prevDepts = form.departments || (form.department ? [form.department] : []);

    // Teams that correspond to the newly selected departments
    const newAutoIds = teams
      .filter(t => newDepts.some(d => t.name.toLowerCase() === d.toLowerCase()))
      .map(t => t.id);

    // Teams that corresponded to removed departments (to deselect them)
    const removedDepts = prevDepts.filter(d => !newDepts.includes(d));
    const removedAutoIds = teams
      .filter(t => removedDepts.some(d => t.name.toLowerCase() === d.toLowerCase()))
      .map(t => t.id);

    // Keep current team_ids minus removed dept-teams, plus new dept-teams
    const current = form.team_ids || [];
    const merged = [...new Set([...current.filter(id => !removedAutoIds.includes(id)), ...newAutoIds])];

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

          {/* Tier */}
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

          {/* Row Number — for manual tree layout positioning */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Row Number (for tree layout)</label>
            <Input
              type="number"
              value={form.row_number || ""}
              onChange={e => setForm({ ...form, row_number: e.target.value ? parseInt(e.target.value) : "" })}
              placeholder="Leave blank to use tier-based rows"
            />
            <p className="text-[10px] text-muted-foreground/70">Set a number to place this position on a specific row (1 = top). Leave blank to auto-position by tier.</p>
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Annual Salary ($)</label>
              <Input
                type="number"
                value={form.salary || ""}
                onChange={e => setForm({ ...form, salary: e.target.value })}
                placeholder="e.g. 65000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hourly Rate ($)</label>
              <Input
                type="number"
                value={form.hourly_rate || ""}
                onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                placeholder="e.g. 25"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hours/Week</label>
              <Input
                type="number"
                value={form.hours_per_week || ""}
                onChange={e => setForm({ ...form, hours_per_week: e.target.value })}
                placeholder="e.g. 40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Weeks/Year</label>
              <Input
                type="number"
                value={form.weeks_per_year || ""}
                onChange={e => setForm({ ...form, weeks_per_year: e.target.value })}
                placeholder="e.g. 52"
              />
            </div>
          </div>

          {/* Summer hours option */}
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={!!form.has_summer_hours}
              onCheckedChange={v => setForm({ ...form, has_summer_hours: v })}
            />
            <span className="text-sm text-muted-foreground">Different summer hours</span>
          </div>

          {form.has_summer_hours && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Summer Hours/Week</label>
                <Input
                  type="number"
                  value={form.summer_hours_per_week || ""}
                  onChange={e => setForm({ ...form, summer_hours_per_week: e.target.value })}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Summer Weeks</label>
                <Input
                  type="number"
                  value={form.summer_weeks || ""}
                  onChange={e => setForm({ ...form, summer_weeks: e.target.value })}
                  placeholder="e.g. 8"
                />
              </div>
            </div>
          )}

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
            <label className="text-xs text-muted-foreground">Reports To (solid line)</label>
            <Select value={form.reports_to_id || "none"} onValueChange={v => setForm({ ...form, reports_to_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="No reporting relationship" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {(positions || []).filter(p => p.id !== editId).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}{p.person_name ? ` (${p.person_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Dotted-Line Reports To</span>
              <span className="text-muted-foreground/50 font-normal">— secondary / advisory relationship</span>
            </label>
            <Select value={form.dotted_line_reports_to_id || "none"} onValueChange={v => setForm({ ...form, dotted_line_reports_to_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(positions || []).filter(p => p.id !== editId && p.id !== form.reports_to_id).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}{p.person_name ? ` (${p.person_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teams — auto-populated from departments, but fully editable */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Teams <span className="text-muted-foreground/50">(auto-suggested — edit freely)</span>
            </label>
            <TeamMultiSelect
              selected={form.team_ids || []}
              onChange={ids => setForm({ ...form, team_ids: ids })}
              teams={teams}
            />
          </div>

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
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}