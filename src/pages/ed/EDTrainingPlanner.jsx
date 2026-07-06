import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Pencil, Trash2, Sparkles, ChevronLeft, Clock, MapPin, User,
  Calendar, ArrowLeftRight, GraduationCap, CheckCircle2, Circle, Loader2, Users, Layers
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import TrainingPlanDialog from "@/components/ed/TrainingPlanDialog";
import TrainingItemDialog from "@/components/ed/TrainingItemDialog";
import AIPlanGenerator from "@/components/ed/AIPlanGenerator";
import TemplatePicker from "@/components/ed/TemplatePicker";
import {
  PLAN_TYPES, PLAN_STATUSES, PHASES, ITEM_TYPES, ITEM_STATUSES,
  getPlanType, getPlanStatus, getPhase, getItemType, getItemStatus,
} from "@/lib/trainingConstants";
import { PHASE_GUIDANCE } from "@/lib/trainingTemplates";

export default function EDTrainingPlanner() {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [defaultItemPhase, setDefaultItemPhase] = useState("first_day");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["training-plans"],
    queryFn: () => base44.entities.TrainingPlan.list("-start_date"),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["training-plan-items"],
    queryFn: () => base44.entities.TrainingPlanItem.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.filter({ status: "active" }),
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const planItems = allItems
    .filter(i => i.plan_id === selectedPlanId)
    .sort((a, b) => {
      const phaseOrder = PHASES.map(p => p.value);
      const pa = phaseOrder.indexOf(a.phase);
      const pb = phaseOrder.indexOf(b.phase);
      if (pa !== pb) return pa - pb;
      if ((a.day_number || 0) !== (b.day_number || 0)) return (a.day_number || 0) - (b.day_number || 0);
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  const calcProgress = (planId) => {
    const items = allItems.filter(i => i.plan_id === planId);
    if (items.length === 0) return 0;
    const done = items.filter(i => i.status === "completed").length;
    return Math.round((done / items.length) * 100);
  };

  // ---- Plan CRUD ----
  const savePlan = async (formData) => {
    if (editingPlan) {
      await base44.entities.TrainingPlan.update(editingPlan.id, formData);
    } else {
      const created = await base44.entities.TrainingPlan.create(formData);
      setSelectedPlanId(created.id);
    }
    qc.invalidateQueries({ queryKey: ["training-plans"] });
    setPlanDialogOpen(false);
    setEditingPlan(null);
  };

  const deletePlan = async (plan) => {
    if (!confirm(`Delete the training plan for ${plan.employee_name}? This also removes all activities.`)) return;
    const items = allItems.filter(i => i.plan_id === plan.id);
    if (items.length > 0) {
      await base44.entities.TrainingPlanItem.deleteMany({ plan_id: plan.id });
    }
    await base44.entities.TrainingPlan.delete(plan.id);
    qc.invalidateQueries({ queryKey: ["training-plans"] });
    qc.invalidateQueries({ queryKey: ["training-plan-items"] });
    if (selectedPlanId === plan.id) setSelectedPlanId(null);
  };

  // ---- Item CRUD ----
  const saveItem = async (formData) => {
    if (editingItem) {
      await base44.entities.TrainingPlanItem.update(editingItem.id, formData);
    } else {
      await base44.entities.TrainingPlanItem.create({ ...formData, plan_id: selectedPlanId });
    }
    qc.invalidateQueries({ queryKey: ["training-plan-items"] });
    setItemDialogOpen(false);
    setEditingItem(null);
  };

  const deleteItem = async (item) => {
    await base44.entities.TrainingPlanItem.delete(item.id);
    qc.invalidateQueries({ queryKey: ["training-plan-items"] });
  };

  const cycleItemStatus = async (item) => {
    const order = ["not_started", "in_progress", "completed", "skipped"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    const update = { status: next };
    if (next === "completed") update.completed_date = format(new Date(), "yyyy-MM-dd");
    await base44.entities.TrainingPlanItem.update(item.id, update);
    qc.invalidateQueries({ queryKey: ["training-plan-items"] });
  };

  // ---- AI Generation ----
  const handleAIGenerated = async (items) => {
    // Bulk create the AI-generated items
    const toCreate = items.map((item, idx) => ({
      plan_id: selectedPlanId,
      title: item.title || "Untitled",
      description: item.description || "",
      phase: PHASES.some(p => p.value === item.phase) ? item.phase : "first_day",
      day_number: item.day_number || 1,
      time_block: item.time_block || "",
      duration_minutes: item.duration_minutes || 30,
      item_type: ITEM_TYPES.some(t => t.value === item.item_type) ? item.item_type : "task",
      owner_name: item.owner_name || "",
      owner_email: "",
      location: item.location || "",
      status: "not_started",
      notes: "",
      sort_order: item.sort_order || idx,
    }));
    if (toCreate.length > 0) {
      await base44.entities.TrainingPlanItem.bulkCreate(toCreate);
      qc.invalidateQueries({ queryKey: ["training-plan-items"] });
    }
  };

  // ---- Template Apply ----
  const handleTemplateApplied = async (items) => {
    const toCreate = items.map((item, idx) => ({
      plan_id: selectedPlanId,
      title: item.title || "Untitled",
      description: item.description || "",
      phase: PHASES.some(p => p.value === item.phase) ? item.phase : "first_day",
      day_number: item.day_number || 1,
      time_block: item.time_block || "",
      duration_minutes: item.duration_minutes || 30,
      item_type: ITEM_TYPES.some(t => t.value === item.item_type) ? item.item_type : "task",
      owner_name: item.owner_name || "",
      owner_email: "",
      location: item.location || "",
      status: "not_started",
      notes: "",
      sort_order: item.sort_order || idx,
    }));
    if (toCreate.length > 0) {
      await base44.entities.TrainingPlanItem.bulkCreate(toCreate);
      qc.invalidateQueries({ queryKey: ["training-plan-items"] });
    }
  };

  // ====== DETAIL VIEW ======
  if (selectedPlan) {
    const progress = calcProgress(selectedPlan.id);
    const startDate = selectedPlan.start_date ? parseISO(selectedPlan.start_date) : null;
    const daysUntil = startDate ? differenceInDays(startDate, new Date()) : null;
    const planType = getPlanType(selectedPlan.plan_type);
    const planStatus = getPlanStatus(selectedPlan.status);

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => setSelectedPlanId(null)} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> All Training Plans
        </Button>

        {/* Plan header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold">{selectedPlan.employee_name}</h1>
                  <Badge className={planType.color}>{planType.label}</Badge>
                  <Badge className={planStatus.color}>{planStatus.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.position_title}
                  {selectedPlan.previous_position && ` (from ${selectedPlan.previous_position})`}
                  {selectedPlan.department && ` · ${selectedPlan.department}`}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  {startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Start: {format(startDate, "MMM d, yyyy")}
                      {daysUntil !== null && daysUntil > 0 && ` (${daysUntil} day${daysUntil !== 1 ? "s" : ""} away)`}
                      {daysUntil === 0 && " (today!)"}
                      {daysUntil < 0 && ` (${Math.abs(daysUntil)} day${daysUntil !== -1 ? "s" : ""} ago)`}
                    </span>
                  )}
                  {selectedPlan.supervisor_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Supervisor: {selectedPlan.supervisor_name}
                    </span>
                  )}
                  {selectedPlan.buddy_mentor_name && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Buddy: {selectedPlan.buddy_mentor_name}
                    </span>
                  )}
                </div>
                {selectedPlan.key_objectives && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Key Objectives</p>
                    <p className="text-sm text-amber-900">{selectedPlan.key_objectives}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingPlan(selectedPlan); setPlanDialogOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePlan(selectedPlan)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Activities ({planItems.length})
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <Layers className="w-4 h-4 mr-1 text-indigo-500" /> Use Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              if (planItems.length > 0 && !confirm("This will add AI-generated items alongside existing ones. Continue?")) return;
              setAiDialogOpen(true);
            }}>
              <Sparkles className="w-4 h-4 mr-1 text-amber-500" /> Generate with AI
            </Button>
            <Button size="sm" onClick={() => { setEditingItem(null); setDefaultItemPhase("first_day"); setItemDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Activity
            </Button>
          </div>
        </div>

        {/* Timeline by phase */}
        {planItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No activities yet.</p>
              <p className="text-xs text-muted-foreground mb-5">Start from a pre-built template, generate a plan with AI, or add activities manually.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button onClick={() => setTemplateDialogOpen(true)}>
                  <Layers className="w-4 h-4 mr-2 text-indigo-500" /> Start from Template
                </Button>
                <Button variant="outline" onClick={() => setAiDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Generate with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {PHASES.map(phase => {
              const phaseItems = planItems.filter(i => i.phase === phase.value);
              if (phaseItems.length === 0) return null;
              return (
                <div key={phase.value}>
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold px-2.5 py-1 rounded-md ${phase.color}`}>{phase.label}</h3>
                      <span className="text-xs text-muted-foreground">{phaseItems.length} activit{phaseItems.length === 1 ? "y" : "ies"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1 ml-1">{PHASE_GUIDANCE[phase.value]}</p>
                  </div>
                  <div className="space-y-2">
                    {phaseItems.map(item => (
                      <PlanItemRow
                        key={item.id}
                        item={item}
                        onCycleStatus={() => cycleItemStatus(item)}
                        onEdit={() => { setEditingItem(item); setItemDialogOpen(true); }}
                        onDelete={() => deleteItem(item)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedPlan.notes && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPlan.notes}</p></CardContent>
          </Card>
        )}

        <TrainingItemDialog
          open={itemDialogOpen}
          onClose={() => { setItemDialogOpen(false); setEditingItem(null); }}
          onSave={saveItem}
          editingItem={editingItem}
          defaultPhase={defaultItemPhase}
        />
        <AIPlanGenerator
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          plan={selectedPlan}
          onGenerated={handleAIGenerated}
        />
        <TemplatePicker
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          plan={selectedPlan}
          onApply={handleTemplateApplied}
        />
        {planDialogOpen && (
          <TrainingPlanDialog
            open={planDialogOpen}
            onClose={() => { setPlanDialogOpen(false); setEditingPlan(null); }}
            onSave={savePlan}
            editingPlan={editingPlan}
            employees={employees}
          />
        )}
      </div>
    );
  }

  // ====== LIST VIEW ======
  const sortedPlans = [...plans].sort((a, b) => {
    // In-progress first, then by start date ascending
    const statusOrder = { in_progress: 0, planning: 1, draft: 2, on_hold: 3, completed: 4 };
    const sa = statusOrder[a.status] ?? 5;
    const sb = statusOrder[b.status] ?? 5;
    if (sa !== sb) return sa - sb;
    return new Date(a.start_date || "9999") - new Date(b.start_date || "9999");
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan onboarding, lateral moves, and role transitions for your team</p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Training Plan
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLAN_STATUSES.slice(0, 4).map(s => {
          const count = plans.filter(p => p.status === s.value).length;
          return (
            <Card key={s.value}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <span className="text-sm font-bold">{count}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans list */}
      {sortedPlans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No training plans yet.</p>
            <p className="text-xs text-muted-foreground mb-4">Create a plan to start organizing someone's first day, first week, or full onboarding journey.</p>
            <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPlans.map(plan => {
            const progress = calcProgress(plan.id);
            const planType = getPlanType(plan.plan_type);
            const planStatus = getPlanStatus(plan.status);
            const itemCount = allItems.filter(i => i.plan_id === plan.id).length;
            const startDate = plan.start_date ? parseISO(plan.start_date) : null;
            const daysUntil = startDate ? differenceInDays(startDate, new Date()) : null;

            return (
              <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlanId(plan.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{plan.employee_name}</h3>
                        <Badge variant="outline" className={planType.color}>{planType.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {plan.position_title}
                        {plan.previous_position && <span className="text-xs"> ← {plan.previous_position}</span>}
                      </p>
                    </div>
                    <Badge className={planStatus.color}>{planStatus.label}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    {startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(startDate, "MMM d")}
                        {daysUntil !== null && daysUntil > 0 && ` · in ${daysUntil}d`}
                        {daysUntil === 0 && " · today"}
                        {daysUntil < 0 && ` · ${Math.abs(daysUntil)}d ago`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {itemCount} activit{itemCount === 1 ? "y" : "ies"}
                    </span>
                    {plan.supervisor_name && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3" /> {plan.supervisor_name}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {planDialogOpen && (
        <TrainingPlanDialog
          open={planDialogOpen}
          onClose={() => { setPlanDialogOpen(false); setEditingPlan(null); }}
          onSave={savePlan}
          editingPlan={editingPlan}
          employees={employees}
        />
      )}
    </div>
  );
}

// ====== Plan Item Row Component ======
function PlanItemRow({ item, onCycleStatus, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const itemType = getItemType(item.item_type);
  const itemStatus = getItemStatus(item.status);
  const StatusIcon = item.status === "completed" ? CheckCircle2 : Circle;

  return (
    <div className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <button onClick={onCycleStatus} className="mt-0.5 shrink-0" title={`Status: ${itemStatus.label} (click to cycle)`}>
          <StatusIcon className={`w-5 h-5 ${item.status === "completed" ? "text-green-500" : item.status === "in_progress" ? "text-blue-500" : "text-slate-300"}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {item.title}
            </span>
            <Badge variant="outline" className={`text-[10px] py-0 ${itemStatus.color}`}>{itemStatus.label}</Badge>
          </div>

          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 ${itemType.color}`}>
              {itemType.label}
            </span>
            {item.day_number > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Day {item.day_number}
              </span>
            )}
            {item.time_block && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.time_block}
              </span>
            )}
            {item.duration_minutes > 0 && <span>{item.duration_minutes}min</span>}
            {item.owner_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {item.owner_name}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {item.location}
              </span>
            )}
          </div>

          {expanded && item.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{item.description}</p>
          )}
          {expanded && item.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">Note: {item.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.description && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
              <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${expanded ? "-rotate-90" : ""}`} />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}