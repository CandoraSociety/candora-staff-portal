import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Loader2, ChevronUp, ChevronDown, Search, ArrowRight, Check, BookOpen
} from "lucide-react";
import {
  PROGRAM_CATEGORIES, PROGRAM_STATUSES,
} from "@/lib/trainingModuleConstants";

const emptyProgram = {
  title: "", description: "", category: "onboarding",
  structure_type: "linear", module_entries: [],
  status: "draft", target_audience: "", estimated_duration_hours: 0, version: 1,
};

export default function ProgramEditorDialog({ open, onClose, onSave, editingProgram }) {
  const [form, setForm] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");

  const { data: allModules = [] } = useQuery({
    queryKey: ["training-modules"],
    queryFn: () => base44.entities.TrainingModule.list("-updated_date"),
    enabled: open,
  });

  useEffect(() => {
    if (editingProgram) {
      setForm({ ...emptyProgram, ...editingProgram });
    } else {
      setForm(emptyProgram);
    }
    setModuleSearch("");
  }, [editingProgram, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isModuleInProgram = (moduleId) => form.module_entries.some(e => e.module_id === moduleId);

  const addModule = (mod) => {
    const maxOrder = form.module_entries.reduce((max, e) => Math.max(max, e.order || 0), 0);
    const entry = {
      id: crypto.randomUUID(),
      module_id: mod.id,
      module_title: mod.title,
      order: maxOrder + 1,
      track_name: form.structure_type === "tracks" ? "Track 1" : "",
      is_required: true,
    };
    update("module_entries", [...form.module_entries, entry]);
  };

  const removeEntry = (entryId) => update("module_entries", form.module_entries.filter(e => e.id !== entryId));

  const moveEntry = (idx, dir) => {
    const arr = [...form.module_entries];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    // Re-assign order
    arr.forEach((e, i) => { e.order = i + 1; });
    update("module_entries", arr);
  };

  const updateEntry = (entryId, field, value) => {
    update("module_entries", form.module_entries.map(e => e.id === entryId ? { ...e, [field]: value } : e));
  };

  const handleStructureChange = (type) => {
    if (type === "linear") {
      update("module_entries", form.module_entries.map(e => ({ ...e, track_name: "" })));
    } else {
      update("module_entries", form.module_entries.map(e => ({ ...e, track_name: e.track_name || "Track 1" })));
    }
    update("structure_type", type);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Please enter a program title."); return; }
    setSaving(true);
    try {
      const payload = { ...form, module_entries: form.module_entries.map((e, i) => ({ ...e, order: i + 1 })) };
      if (editingProgram) {
        await base44.entities.TrainingProgram.update(editingProgram.id, payload);
      } else {
        await base44.entities.TrainingProgram.create(payload);
      }
      onSave();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save program: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const availableModules = allModules.filter(m =>
    !isModuleInProgram(m.id) &&
    (!moduleSearch || m.title?.toLowerCase().includes(moduleSearch.toLowerCase()))
  );

  // Group entries by track for tracks structure
  const tracks = form.structure_type === "tracks"
    ? Array.from(new Set(form.module_entries.map(e => e.track_name || "Default")))
    : ["__linear__"];

  const sortedEntries = [...form.module_entries].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingProgram ? "Edit Program" : "New Training Program"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. New Staff Onboarding Program" />
            </div>
            <div>
              <Label className="mb-1 block">Description</Label>
              <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} placeholder="What this program covers and its goals" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Category</Label>
                <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                  {PROGRAM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <select value={form.status} onChange={e => update("status", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                  {PROGRAM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Est. Duration (hrs)</Label>
                <Input type="number" min="0" step="0.5" value={form.estimated_duration_hours} onChange={e => update("estimated_duration_hours", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Version</Label>
                <Input type="number" min="1" value={form.version} onChange={e => update("version", parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Target Audience</Label>
              <Input value={form.target_audience} onChange={e => update("target_audience", e.target.value)} placeholder="e.g. All new staff, Volunteers, Front-line workers" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Structure</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStructureChange("linear")}
                  className={`flex-1 border rounded-lg p-3 text-left transition-colors ${form.structure_type === "linear" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div className="text-sm font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> Linear Sequence</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Modules completed in order: 1 → 2 → 3</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStructureChange("tracks")}
                  className={`flex-1 border rounded-lg p-3 text-left transition-colors ${form.structure_type === "tracks" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div className="text-sm font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> Multi-Track Paths</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Modules grouped into named tracks/paths</div>
                </button>
              </div>
            </div>
          </div>

          {/* Module assembly */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Modules in Program ({form.module_entries.length})</Label>
            </div>

            {/* Current entries */}
            {sortedEntries.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg mb-3">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No modules added yet. Pick from the library below.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-3">
                {tracks.map(trackName => {
                  const trackEntries = form.structure_type === "tracks"
                    ? sortedEntries.filter(e => (e.track_name || "Default") === trackName)
                    : sortedEntries;
                  if (trackEntries.length === 0) return null;
                  return (
                    <div key={trackName}>
                      {form.structure_type === "tracks" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={trackName}
                            onChange={e => {
                              const oldName = trackName;
                              update("module_entries", form.module_entries.map(ent =>
                                (ent.track_name || "Default") === oldName ? { ...ent, track_name: e.target.value } : ent
                              ));
                            }}
                            className="text-sm font-semibold h-7 w-48"
                          />
                          <Badge variant="outline" className="text-[10px]">{trackEntries.length} module{trackEntries.length !== 1 ? "s" : ""}</Badge>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {trackEntries.map((entry, idx) => {
                          const globalIdx = sortedEntries.indexOf(entry);
                          return (
                            <div key={entry.id} className="flex items-center gap-2 border rounded-lg p-2 bg-card">
                              <div className="flex flex-col">
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveEntry(globalIdx, -1)} disabled={globalIdx === 0}><ChevronUp className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveEntry(globalIdx, 1)} disabled={globalIdx === sortedEntries.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                              </div>
                              <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                              <span className="text-sm flex-1 truncate">{entry.module_title}</span>
                              <button
                                type="button"
                                onClick={() => updateEntry(entry.id, "is_required", !entry.is_required)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${entry.is_required ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-500"}`}
                              >
                                {entry.is_required ? "Required" : "Optional"}
                              </button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeEntry(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Module library */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <Label className="text-xs mb-2 block">Module Library — click to add</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={moduleSearch}
                  onChange={e => setModuleSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {allModules.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-4">No modules exist yet. Create modules in the Module Builder first.</p>
                ) : availableModules.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-4">{allModules.length === form.module_entries.length ? "All modules added to this program." : "No modules match your search."}</p>
                ) : (
                  availableModules.slice(0, 20).map(mod => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => addModule(mod)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-background transition-colors text-left"
                    >
                      <Plus className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-sm flex-1 truncate">{mod.title}</span>
                      <Badge variant="outline" className="text-[10px]">{mod.category}</Badge>
                      {mod.status === "published" && <Check className="w-3 h-3 text-green-500" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {form.module_entries.length} module(s) · {form.structure_type === "tracks" ? tracks.length + " track(s)" : "Linear"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingProgram ? "Save Changes" : "Create Program"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}