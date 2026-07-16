import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Plus, Save, Trash2, Copy, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import ScheduleGrid from "@/components/ed/ScheduleGrid";
import { DAYS, formatHour, categoryColor } from "@/lib/scheduleConstants";

export default function EDScheduleMaker() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["ed-schedules"],
    queryFn: () => base44.entities.WeeklySchedule.list("-updated_date"),
  });

  // Auto-select first schedule or new state
  useEffect(() => {
    if (!selectedId && schedules.length > 0 && !dirty) {
      selectSchedule(schedules[0]);
    }
  }, [schedules, selectedId, dirty]);

  const selectSchedule = (sched) => {
    setSelectedId(sched.id);
    setName(sched.name || "");
    setDescription(sched.description || "");
    setWeekStartDate(sched.week_start_date || "");
    setIsTemplate(sched.is_template || false);
    setBlocks(sched.time_blocks || []);
    setDirty(false);
  };

  const newSchedule = () => {
    setSelectedId(null);
    setName("New Weekly Schedule");
    setDescription("");
    setWeekStartDate("");
    setIsTemplate(false);
    setBlocks([]);
    setDirty(true);
  };

  const markDirty = useCallback(() => setDirty(true), []);

  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Please enter a schedule name."); return; }
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        week_start_date: weekStartDate || null,
        is_template: isTemplate,
        time_blocks: blocks,
        created_by_name: user?.full_name || "",
      };
      if (selectedId) {
        await base44.entities.WeeklySchedule.update(selectedId, payload);
        toast.success("Schedule saved!");
      } else {
        const created = await base44.entities.WeeklySchedule.create(payload);
        setSelectedId(created.id);
        toast.success("Schedule created!");
      }
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["ed-schedules"] });
    } catch (err) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this schedule? This cannot be undone.")) return;
    try {
      await base44.entities.WeeklySchedule.delete(selectedId);
      toast.success("Schedule deleted.");
      qc.invalidateQueries({ queryKey: ["ed-schedules"] });
      setSelectedId(null);
      setBlocks([]);
      setName("");
      setDirty(false);
    } catch (err) {
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const handleDuplicate = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const created = await base44.entities.WeeklySchedule.create({
        name: `${name} (Copy)`,
        description,
        week_start_date: null,
        is_template: isTemplate,
        time_blocks: blocks,
        created_by_name: user?.full_name || "",
      });
      setSelectedId(created.id);
      setName(created.name);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["ed-schedules"] });
      toast.success("Schedule duplicated!");
    } catch (err) {
      toast.error("Failed to duplicate: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  // Calculate total scheduled hours
  const totalHours = blocks.reduce((sum, b) => sum + (b.end_hour - b.start_hour), 0);

  const weekDateLabel = (dayValue) => {
    if (!weekStartDate) return DAYS[dayValue].label;
    try {
      return format(addDays(parseISO(weekStartDate), dayValue), "EEE MMM d");
    } catch {
      return DAYS[dayValue].label;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CalendarDays className="w-5 h-5 text-primary shrink-0" />
          <select
            value={selectedId || ""}
            onChange={e => { const s = schedules.find(s => s.id === e.target.value); if (s) selectSchedule(s); }}
            className="h-9 rounded-md border border-input bg-transparent text-sm px-2 max-w-xs"
          >
            <option value="">— New / unsaved —</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.is_template ? " (template)" : s.week_start_date ? ` — ${s.week_start_date}` : ""}</option>
            ))}
          </select>
          {dirty && <span className="text-[10px] text-amber-600 font-medium">Unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={newSchedule}><Plus className="w-3.5 h-3.5 mr-1" /> New</Button>
          {selectedId && (
            <>
              <Button variant="outline" size="sm" onClick={handleDuplicate}><Copy className="w-3.5 h-3.5 mr-1" /> Duplicate</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {selectedId ? "Save" : "Create"}
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Schedule meta */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label className="text-xs mb-1 block">Schedule Name</Label>
                <Input value={name} onChange={e => { setName(e.target.value); markDirty(); }} placeholder="e.g. Default Week" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Week Starting (Monday)</Label>
                <Input type="date" value={weekStartDate} onChange={e => { setWeekStartDate(e.target.value); markDirty(); }} className="text-sm" />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isTemplate} onChange={e => { setIsTemplate(e.target.checked); markDirty(); }} className="rounded" />
                  Save as reusable template
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description (optional)</Label>
              <Textarea value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} rows={1} placeholder="Notes about this schedule" className="text-sm" />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totalHours.toFixed(1)} hrs scheduled</span>
              <span>{blocks.length} block(s)</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly grid */}
        <ScheduleGrid blocks={blocks} onBlocksChange={handleBlocksChange} />
      </div>

      {/* Bottom save bar */}
      {dirty && (
        <div className="sticky bottom-4 z-10 px-6">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2.5 flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm font-medium">You have unsaved changes</span>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}