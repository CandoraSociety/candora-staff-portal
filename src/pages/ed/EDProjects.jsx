import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Sparkles, Loader2, CheckSquare, Square } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUSES = ["planning", "active", "on_hold", "completed", "archived"];
const RISKS = ["low", "medium", "high", "critical"];
const RISK_COLORS = { low: "secondary", medium: "default", high: "default", critical: "destructive" };
const STATUS_COLORS = { planning: "secondary", active: "default", on_hold: "outline", completed: "outline", archived: "outline" };

const EMPTY = { name: "", description: "", status: "planning", risk_level: "low", progress_percent: 0, budget_allocated: "", budget_spent: "", start_date: "", end_date: "", milestones: [], collaborators: [] };

export default function EDProjects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [newMilestone, setNewMilestone] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");

  const { data: projects = [] } = useQuery({ queryKey: ["ed-projects"], queryFn: () => base44.entities.EDProject.list() });

  const save = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await base44.entities.EDProject.update(editId, form);
    } else {
      await base44.entities.EDProject.create({ ...form, owner_id: user?.id });
    }
    qc.invalidateQueries({ queryKey: ["ed-projects"] });
    setOpen(false); setForm(EMPTY); setEditId(null);
  };

  const del = async (id) => { await base44.entities.EDProject.delete(id); qc.invalidateQueries({ queryKey: ["ed-projects"] }); };
  const openEdit = (p) => { setForm({ ...p, milestones: p.milestones || [], collaborators: p.collaborators || [] }); setEditId(p.id); setOpen(true); };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setForm(f => ({ ...f, milestones: [...(f.milestones || []), { id: Date.now().toString(), title: newMilestone, completed: false, due_date: "" }] }));
    setNewMilestone("");
  };

  const toggleMilestone = (id) => {
    setForm(f => ({ ...f, milestones: f.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m) }));
  };

  const addCollaborator = () => {
    if (!collaboratorInput.trim()) return;
    setForm(f => ({ ...f, collaborators: [...(f.collaborators || []), collaboratorInput.trim()] }));
    setCollaboratorInput("");
  };

  const getAIAssessment = async (project) => {
    setAiLoading(project.id);
    const msDone = (project.milestones || []).filter(m => m.completed).length;
    const msTotal = (project.milestones || []).length;
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are advising an Executive Director. Assess the health of this project:\nName: ${project.name}\nDescription: ${project.description || "none"}\nStatus: ${project.status}, Risk: ${project.risk_level}\nProgress: ${project.progress_percent}%\nMilestones: ${msDone}/${msTotal} complete\nBudget: $${project.budget_allocated || 0} allocated, $${project.budget_spent || 0} spent\nProvide a 3-sentence risk assessment and recommendation.`
    });
    await base44.entities.EDProject.update(project.id, { ai_assessment: res });
    qc.invalidateQueries({ queryKey: ["ed-projects"] });
    setAiLoading(null);
    setExpandedId(project.id);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Projects</h1>
        <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No projects yet.</p>}
        {projects.map(p => {
          const isExpanded = expandedId === p.id;
          const msDone = (p.milestones || []).filter(m => m.completed).length;
          const msTotal = (p.milestones || []).length;
          return (
            <Card key={p.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                    <div className="flex gap-1 mt-1">
                      <Badge variant={STATUS_COLORS[p.status]}>{p.status}</Badge>
                      <Badge variant={RISK_COLORS[p.risk_level]} className="capitalize">{p.risk_level} risk</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => getAIAssessment(p)} disabled={aiLoading === p.id}>
                      {aiLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span>{p.progress_percent || 0}%</span>
                  </div>
                  <Progress value={p.progress_percent || 0} className="h-2" />
                </div>
                {(p.budget_allocated || p.budget_spent) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Budget</span>
                    <span>${(p.budget_spent || 0).toLocaleString()} / ${(p.budget_allocated || 0).toLocaleString()}</span>
                  </div>
                )}
                {msTotal > 0 && <div className="text-xs text-muted-foreground">{msDone}/{msTotal} milestones complete</div>}
                {isExpanded && p.ai_assessment && (
                  <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <span className="font-semibold">AI Assessment: </span>{p.ai_assessment}
                  </div>
                )}
                {p.ai_assessment && (
                  <button className="text-xs text-muted-foreground underline" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                    {isExpanded ? "Hide" : "Show"} AI assessment
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Project name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.risk_level} onValueChange={v => setForm({ ...form, risk_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISKS.map(r => <SelectItem key={r} value={r}>{r} risk</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 text-[10px] bg-background px-1 text-muted-foreground z-10">Start</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-2 text-[10px] bg-background px-1 text-muted-foreground z-10">End</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Budget allocated" value={form.budget_allocated} onChange={e => setForm({ ...form, budget_allocated: parseFloat(e.target.value) || "" })} />
              <Input type="number" placeholder="Budget spent" value={form.budget_spent} onChange={e => setForm({ ...form, budget_spent: parseFloat(e.target.value) || "" })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Progress %</label>
              <Input type="number" min="0" max="100" value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: parseInt(e.target.value) || 0 })} />
            </div>
            {/* Milestones */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Milestones</label>
              {(form.milestones || []).map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <button onClick={() => toggleMilestone(m.id)}>
                    {m.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <span className={`text-sm flex-1 ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setForm(f => ({ ...f, milestones: f.milestones.filter(x => x.id !== m.id) }))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add milestone" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyDown={e => e.key === "Enter" && addMilestone()} className="flex-1" />
                <Button size="sm" variant="outline" onClick={addMilestone}><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
            {/* Collaborators */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Collaborators (emails)</label>
              <div className="flex flex-wrap gap-1">
                {(form.collaborators || []).map(c => (
                  <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, collaborators: f.collaborators.filter(x => x !== c) }))}>
                    {c} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="email@example.com" value={collaboratorInput} onChange={e => setCollaboratorInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addCollaborator()} className="flex-1" />
                <Button size="sm" variant="outline" onClick={addCollaborator}><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
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