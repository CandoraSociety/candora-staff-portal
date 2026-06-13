import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery as useQ, useQueryClient as useQC } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, FlaskConical } from "lucide-react";

const EMPTY_BUDGET = { name: "", fiscal_year: new Date().getFullYear().toString(), total_amount: "", categories: [], notes: "" };
const EMPTY_CAT = { id: "", name: "", allocated: "", spent: "", funder_restricted: false, funder_name: "", cap_percent: "" };

export default function EDBudgets() {
  const { user } = useAuth();
  const qc = useQC();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_BUDGET);
  const [editId, setEditId] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [newCat, setNewCat] = useState(EMPTY_CAT);
  const [whatIf, setWhatIf] = useState({});
  const [showWhatIf, setShowWhatIf] = useState(false);

  const { data: budgets = [] } = useQ({ queryKey: ["ed-budgets"], queryFn: () => base44.entities.EDBudget.list() });

  const save = async () => {
    if (!form.name.trim()) return;
    const data = { ...form, total_amount: parseFloat(form.total_amount) || 0 };
    if (editId) await base44.entities.EDBudget.update(editId, data);
    else await base44.entities.EDBudget.create({ ...data, owner_id: user?.id });
    qc.invalidateQueries({ queryKey: ["ed-budgets"] });
    setOpen(false); setForm(EMPTY_BUDGET); setEditId(null);
  };

  const del = async (id) => {
    await base44.entities.EDBudget.delete(id);
    qc.invalidateQueries({ queryKey: ["ed-budgets"] });
    if (selectedBudget?.id === id) setSelectedBudget(null);
  };

  const openEdit = (b) => { setForm({ ...b }); setEditId(b.id); setOpen(true); };

  const addCategory = () => {
    if (!newCat.name.trim()) return;
    const cat = { ...newCat, id: Date.now().toString(), allocated: parseFloat(newCat.allocated) || 0, spent: parseFloat(newCat.spent) || 0, cap_percent: parseFloat(newCat.cap_percent) || null };
    setForm(f => ({ ...f, categories: [...(f.categories || []), cat] }));
    setNewCat(EMPTY_CAT);
  };

  const selectBudget = (b) => {
    setSelectedBudget(b);
    const wi = {};
    (b.categories || []).forEach(c => { wi[c.id] = c.allocated; });
    setWhatIf(wi);
  };

  const budget = selectedBudget || budgets[0];
  const cats = budget?.categories || [];
  const totalAllocated = cats.reduce((s, c) => s + (c.allocated || 0), 0);
  const totalSpent = cats.reduce((s, c) => s + (c.spent || 0), 0);
  const whatIfTotal = Object.values(whatIf).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budgets</h1>
        <Button size="sm" onClick={() => { setForm(EMPTY_BUDGET); setEditId(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Budget
        </Button>
      </div>

      {/* Budget selector */}
      {budgets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {budgets.map(b => (
            <Button key={b.id} size="sm" variant={budget?.id === b.id ? "default" : "outline"} onClick={() => selectBudget(b)}>
              {b.name} <span className="text-xs ml-1 opacity-70">{b.fiscal_year}</span>
            </Button>
          ))}
        </div>
      )}

      {!budget && <p className="text-sm text-muted-foreground text-center py-8">No budgets yet. Create one to get started.</p>}

      {budget && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{budget.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">FY {budget.fiscal_year}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowWhatIf(!showWhatIf)}>
                    <FlaskConical className="w-4 h-4 mr-1 text-purple-500" /> What-If
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del(budget.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-bold">${(budget.total_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground">Allocated</p>
                  <p className="text-lg font-bold">${totalAllocated.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-lg font-bold">${totalSpent.toLocaleString()}</p>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="space-y-2">
                {cats.length === 0 && <p className="text-sm text-muted-foreground">No categories defined.</p>}
                {cats.map(cat => {
                  const spentPct = cat.allocated ? Math.min(100, (cat.spent / cat.allocated) * 100) : 0;
                  const wiVal = showWhatIf ? (parseFloat(whatIf[cat.id]) || 0) : null;
                  const overCap = cat.cap_percent && cat.allocated && ((cat.spent / cat.allocated) * 100) > cat.cap_percent;
                  return (
                    <div key={cat.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat.name}</span>
                          {cat.funder_restricted && <Badge variant="outline" className="text-xs">{cat.funder_name || "Restricted"}</Badge>}
                          {overCap && <Badge variant="destructive" className="text-xs">Over cap</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${(cat.spent || 0).toLocaleString()} / ${(cat.allocated || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${spentPct >= 90 ? "bg-red-500" : spentPct >= 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${spentPct}%` }} />
                      </div>
                      {showWhatIf && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24">What-If alloc:</span>
                          <Input type="number" className="h-7 text-xs" value={whatIf[cat.id] || ""} onChange={e => setWhatIf(w => ({ ...w, [cat.id]: e.target.value }))} />
                          {wiVal !== null && <span className="text-xs text-purple-600">${wiVal.toLocaleString()}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showWhatIf && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs font-semibold text-purple-700">What-If Scenario</p>
                  <p className="text-sm text-purple-800">Total What-If: <strong>${whatIfTotal.toLocaleString()}</strong> of ${(budget.total_amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-purple-600">{whatIfTotal > budget.total_amount ? "⚠️ Over budget" : `✅ $${(budget.total_amount - whatIfTotal).toLocaleString()} remaining`}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Budget" : "New Budget"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Budget name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Fiscal Year (e.g. 2025)" value={form.fiscal_year} onChange={e => setForm({ ...form, fiscal_year: e.target.value })} />
              <Input type="number" placeholder="Total amount" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} />
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Budget Categories</label>
              {(form.categories || []).map(cat => (
                <div key={cat.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded text-xs">
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <span>${cat.allocated?.toLocaleString()}</span>
                  {cat.funder_restricted && <Badge variant="outline" className="text-xs">Restricted</Badge>}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setForm(f => ({ ...f, categories: f.categories.filter(c => c.id !== cat.id) }))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Add Category</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Category name" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                  <Input type="number" placeholder="Allocated $" value={newCat.allocated} onChange={e => setNewCat({ ...newCat, allocated: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Spent $" value={newCat.spent} onChange={e => setNewCat({ ...newCat, spent: e.target.value })} />
                  <Input type="number" placeholder="Cap %" value={newCat.cap_percent} onChange={e => setNewCat({ ...newCat, cap_percent: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newCat.funder_restricted} onCheckedChange={v => setNewCat({ ...newCat, funder_restricted: v })} />
                  <span className="text-xs">Funder restricted</span>
                  {newCat.funder_restricted && <Input placeholder="Funder name" className="flex-1" value={newCat.funder_name} onChange={e => setNewCat({ ...newCat, funder_name: e.target.value })} />}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={addCategory}><Plus className="w-3 h-3 mr-1" /> Add</Button>
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