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
import { Plus, Pencil, Trash2, Sparkles, Loader2, TrendingUp, TrendingDown, Minus, History } from "lucide-react";

const CATEGORIES = ["financial", "operational", "growth", "customer", "employee", "impact"];
const CAT_COLORS = { financial: "bg-green-100 text-green-700", operational: "bg-blue-100 text-blue-700", growth: "bg-purple-100 text-purple-700", customer: "bg-pink-100 text-pink-700", employee: "bg-amber-100 text-amber-700", impact: "bg-teal-100 text-teal-700" };

const EMPTY = { name: "", description: "", category: "operational", current_value: "", target_value: "", unit: "", trend: "flat", history: [] };

export default function EDKPIs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [logValue, setLogValue] = useState({ id: null, value: "", note: "" });
  const [historyKPI, setHistoryKPI] = useState(null);
  const [filterCat, setFilterCat] = useState("all");

  const { data: kpis = [] } = useQuery({ queryKey: ["ed-kpis"], queryFn: () => base44.entities.EDKPI.list() });

  const save = async () => {
    if (!form.name.trim()) return;
    const data = { ...form, current_value: parseFloat(form.current_value) || 0, target_value: parseFloat(form.target_value) || 0 };
    if (editId) await base44.entities.EDKPI.update(editId, data);
    else await base44.entities.EDKPI.create({ ...data, owner_id: user?.id });
    qc.invalidateQueries({ queryKey: ["ed-kpis"] });
    setOpen(false); setForm(EMPTY); setEditId(null);
  };

  const del = async (id) => { await base44.entities.EDKPI.delete(id); qc.invalidateQueries({ queryKey: ["ed-kpis"] }); };
  const openEdit = (k) => { setForm({ ...k }); setEditId(k.id); setOpen(true); };

  const logHistory = async () => {
    if (!logValue.id || !logValue.value) return;
    const kpi = kpis.find(k => k.id === logValue.id);
    const entry = { date: new Date().toISOString().split("T")[0], value: parseFloat(logValue.value), note: logValue.note };
    const history = [...(kpi.history || []), entry];
    await base44.entities.EDKPI.update(logValue.id, { history, current_value: parseFloat(logValue.value) });
    qc.invalidateQueries({ queryKey: ["ed-kpis"] });
    setLogValue({ id: null, value: "", note: "" });
  };

  const getAISuggestions = async () => {
    setAiLoading(true);
    const summary = kpis.map(k => `${k.name} (${k.category}): ${k.current_value}${k.unit || ""} / target ${k.target_value}${k.unit || ""}`).join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are advising an Executive Director of a non-profit. Based on these existing KPIs:\n${summary || "none yet"}\n\nSuggest 5 additional strategic KPIs they should track. For each provide: name, category (financial/operational/growth/customer/employee/impact), and why it matters. Keep it concise.`
    });
    setAiSuggestions(res);
    setAiLoading(false);
  };

  const filtered = filterCat === "all" ? kpis : kpis.filter(k => k.category === filterCat);
  const grouped = filtered.reduce((acc, k) => { acc[k.category] = [...(acc[k.category] || []), k]; return acc; }, {});

  const TrendIcon = ({ trend }) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">KPIs</h1>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={getAISuggestions} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
            <span className="ml-1">AI Suggest</span>
          </Button>
          <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New KPI
          </Button>
        </div>
      </div>

      {aiSuggestions && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-800">AI KPI Suggestions</CardTitle></CardHeader>
          <CardContent className="text-xs text-amber-800 whitespace-pre-line">{aiSuggestions}</CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(kpi => {
              const pct = kpi.target_value ? Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100)) : 0;
              return (
                <Card key={kpi.id} className="group">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{kpi.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CAT_COLORS[kpi.category] || "bg-muted text-muted-foreground"}`}>{kpi.category}</span>
                      </div>
                      <TrendIcon trend={kpi.trend} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{kpi.current_value ?? "–"}</span>
                      <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {kpi.target_value ?? "–"}{kpi.unit}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLogValue({ id: kpi.id, value: "", note: "" })}>
                        <History className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHistoryKPI(kpi)}>
                        <TrendingUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(kpi)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => del(kpi.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Log value dialog */}
      <Dialog open={!!logValue.id} onOpenChange={() => setLogValue({ id: null, value: "", note: "" })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log New Value</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="New value" value={logValue.value} onChange={e => setLogValue({ ...logValue, value: e.target.value })} />
            <Input placeholder="Note (optional)" value={logValue.note} onChange={e => setLogValue({ ...logValue, note: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLogValue({ id: null, value: "", note: "" })}>Cancel</Button>
              <Button onClick={logHistory}>Log</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyKPI} onOpenChange={() => setHistoryKPI(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{historyKPI?.name} — History</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(historyKPI?.history || []).length === 0 && <p className="text-sm text-muted-foreground">No history logged yet.</p>}
            {[...(historyKPI?.history || [])].reverse().map((h, i) => (
              <div key={i} className="flex justify-between text-sm p-2 bg-muted/40 rounded">
                <span className="text-muted-foreground">{h.date}</span>
                <span className="font-medium">{h.value}{historyKPI?.unit}</span>
                {h.note && <span className="text-xs text-muted-foreground">{h.note}</span>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit KPI" : "New KPI"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="KPI name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.trend} onValueChange={v => setForm({ ...form, trend: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">Trending Up</SelectItem>
                  <SelectItem value="down">Trending Down</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Current" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} />
              <Input type="number" placeholder="Target" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
              <Input placeholder="Unit (%, $, #)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
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