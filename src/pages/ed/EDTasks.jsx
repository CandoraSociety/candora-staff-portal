import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUSES = [
  { value: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "waiting", label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];
const PRIORITIES = ["low", "medium", "high", "critical"];
const PRIORITY_COLORS = { low: "outline", medium: "secondary", high: "default", critical: "destructive" };

const EMPTY = { title: "", description: "", status: "not_started", priority: "medium", due_date: "", category: "", tags: [] };

export default function EDTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [aiLoading, setAiLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: tasks = [] } = useQuery({ queryKey: ["ed-tasks"], queryFn: () => base44.entities.EDTask.list() });

  const save = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await base44.entities.EDTask.update(editId, form);
    } else {
      await base44.entities.EDTask.create({ ...form, owner_id: user?.id });
    }
    qc.invalidateQueries({ queryKey: ["ed-tasks"] });
    setOpen(false);
    setForm(EMPTY);
    setEditId(null);
  };

  const del = async (id) => {
    await base44.entities.EDTask.delete(id);
    qc.invalidateQueries({ queryKey: ["ed-tasks"] });
  };

  const openEdit = (t) => { setForm({ ...t }); setEditId(t.id); setOpen(true); };

  const cycleStatus = async (task) => {
    const idx = STATUSES.findIndex(s => s.value === task.status);
    const next = STATUSES[(idx + 1) % STATUSES.length].value;
    await base44.entities.EDTask.update(task.id, { status: next });
    qc.invalidateQueries({ queryKey: ["ed-tasks"] });
  };

  const getAISuggestion = async (task) => {
    setAiLoading(task.id);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an advisor to an Executive Director. Given this task: "${task.title}" (${task.description || "no description"}), priority: ${task.priority}, status: ${task.status} — provide a concise 2-3 sentence recommendation on how to handle or approach this task effectively.`
    });
    await base44.entities.EDTask.update(task.id, { ai_suggestion: res });
    qc.invalidateQueries({ queryKey: ["ed-tasks"] });
    setAiLoading(null);
    setExpandedId(task.id);
  };

  const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tasks found.</p>}
        {filtered.map(task => {
          const st = STATUSES.find(s => s.value === task.status);
          return (
            <Card key={task.id} className="group">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => cycleStatus(task)} className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${st?.color}`}>{st?.label}</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <Badge variant={PRIORITY_COLORS[task.priority] || "outline"} className="text-xs">{task.priority}</Badge>
                      {task.due_date && <span className="text-xs text-muted-foreground">{format(parseISO(task.due_date), "MMM d")}</span>}
                      {task.category && <span className="text-xs text-muted-foreground">· {task.category}</span>}
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                    {expandedId === task.id && task.ai_suggestion && (
                      <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        <span className="font-semibold">AI Suggestion: </span>{task.ai_suggestion}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === task.id ? "rotate-180" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => getAISuggestion(task)} disabled={aiLoading === task.id}>
                      {aiLoading === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(task.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 text-[10px] bg-background px-1 text-muted-foreground z-10">Due Date</label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <Input placeholder="Tags (comma separated)" value={(form.tags || []).join(", ")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} />
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