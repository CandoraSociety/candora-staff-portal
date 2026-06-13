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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, CheckSquare, Square, Archive, RotateCcw } from "lucide-react";

const STATUSES = ["active", "at_risk", "completed", "archived"];
const STATUS_COLORS = { active: "default", at_risk: "destructive", completed: "secondary", archived: "outline" };
const CURRENT_YEAR = new Date().getFullYear();
const QUARTERS = [`Q1 ${CURRENT_YEAR}`, `Q2 ${CURRENT_YEAR}`, `Q3 ${CURRENT_YEAR}`, `Q4 ${CURRENT_YEAR}`, `Q1 ${CURRENT_YEAR + 1}`, `Q2 ${CURRENT_YEAR + 1}`];

const EMPTY = { title: "", description: "", quarter: `Q1 ${CURRENT_YEAR}`, status: "active", progress_percent: 0, key_results: [] };

export default function EDOPSP() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState("active");
  const [newKR, setNewKR] = useState({ title: "", target: "", current: "" });

  const { data: objectives = [] } = useQuery({ queryKey: ["ed-objectives"], queryFn: () => base44.entities.EDObjective.list() });

  const save = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await base44.entities.EDObjective.update(editId, form);
    } else {
      await base44.entities.EDObjective.create({ ...form, owner_id: user?.id });
    }
    qc.invalidateQueries({ queryKey: ["ed-objectives"] });
    setOpen(false); setForm(EMPTY); setEditId(null);
  };

  const del = async (id) => { await base44.entities.EDObjective.delete(id); qc.invalidateQueries({ queryKey: ["ed-objectives"] }); };
  const openEdit = (o) => { setForm({ ...o, key_results: o.key_results || [] }); setEditId(o.id); setOpen(true); };
  const archive = async (o) => { await base44.entities.EDObjective.update(o.id, { status: "archived" }); qc.invalidateQueries({ queryKey: ["ed-objectives"] }); };
  const restore = async (o) => { await base44.entities.EDObjective.update(o.id, { status: "active" }); qc.invalidateQueries({ queryKey: ["ed-objectives"] }); };

  const addKR = () => {
    if (!newKR.title.trim()) return;
    setForm(f => ({ ...f, key_results: [...(f.key_results || []), { id: Date.now().toString(), ...newKR, completed: false }] }));
    setNewKR({ title: "", target: "", current: "" });
  };

  const toggleKR = (id) => {
    setForm(f => ({ ...f, key_results: f.key_results.map(k => k.id === id ? { ...k, completed: !k.completed } : k) }));
  };

  const filtered = tab === "all" ? objectives : objectives.filter(o => o.status === tab);
  const grouped = filtered.reduce((acc, o) => { const q = o.quarter || "No Quarter"; acc[q] = [...(acc[q] || []), o]; return acc; }, {});

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">OPSP — One Page Strategic Plan</h1>
        <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Objective
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {["active", "at_risk", "completed", "archived", "all"].map(s => (
            <TabsTrigger key={s} value={s} className="capitalize">{s === "at_risk" ? "At Risk" : s}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="space-y-6 mt-4">
          {Object.keys(grouped).length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No objectives here.</p>}
          {Object.entries(grouped).map(([quarter, objs]) => (
            <div key={quarter}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{quarter}</h3>
              <div className="space-y-3">
                {objs.map(obj => {
                  const krDone = (obj.key_results || []).filter(k => k.completed).length;
                  const krTotal = (obj.key_results || []).length;
                  return (
                    <Card key={obj.id} className="group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{obj.title}</CardTitle>
                            {obj.description && <p className="text-xs text-muted-foreground mt-0.5">{obj.description}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={STATUS_COLORS[obj.status]}>{obj.status === "at_risk" ? "At Risk" : obj.status}</Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {obj.status !== "archived" ? (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archive(obj)}><Archive className="w-3.5 h-3.5" /></Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => restore(obj)}><RotateCcw className="w-3.5 h-3.5" /></Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(obj)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(obj.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span><span>{obj.progress_percent || 0}%</span>
                          </div>
                          <Progress value={obj.progress_percent || 0} className="h-1.5" />
                        </div>
                        {krTotal > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Key Results ({krDone}/{krTotal})</p>
                            {(obj.key_results || []).map(kr => (
                              <div key={kr.id} className="flex items-start gap-2 text-xs">
                                {kr.completed ? <CheckSquare className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> : <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                                <span className={kr.completed ? "line-through text-muted-foreground" : ""}>{kr.title}</span>
                                {kr.target && <span className="text-muted-foreground ml-auto shrink-0">{kr.current || "–"} / {kr.target}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Objective" : "New Objective"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Objective title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.quarter} onValueChange={v => setForm({ ...form, quarter: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Progress %</label>
              <Input type="number" min="0" max="100" value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: parseInt(e.target.value) || 0 })} />
            </div>
            {/* Key Results */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Key Results</label>
              {(form.key_results || []).map(kr => (
                <div key={kr.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded">
                  <button onClick={() => toggleKR(kr.id)}>
                    {kr.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <span className={`text-sm flex-1 ${kr.completed ? "line-through text-muted-foreground" : ""}`}>{kr.title}</span>
                  {kr.target && <span className="text-xs text-muted-foreground">{kr.current || "–"}/{kr.target}</span>}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setForm(f => ({ ...f, key_results: f.key_results.filter(k => k.id !== kr.id) }))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-1">
                <Input placeholder="Key result title" value={newKR.title} onChange={e => setNewKR({ ...newKR, title: e.target.value })} className="col-span-2" />
                <Input placeholder="Target" value={newKR.target} onChange={e => setNewKR({ ...newKR, target: e.target.value })} />
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={addKR}><Plus className="w-3 h-3 mr-1" /> Add Key Result</Button>
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