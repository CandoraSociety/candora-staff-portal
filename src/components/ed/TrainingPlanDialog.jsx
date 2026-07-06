import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PLAN_TYPES, PLAN_STATUSES } from "@/lib/trainingConstants";

const selectClass = "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const EMPTY = {
  employee_name: "",
  employee_email: "",
  plan_type: "onboarding",
  position_title: "",
  previous_position: "",
  department: "",
  start_date: "",
  supervisor_name: "",
  supervisor_email: "",
  buddy_mentor_name: "",
  buddy_mentor_email: "",
  status: "draft",
  key_objectives: "",
  notes: "",
};

const MODES = [
  { id: "individual", label: "Individual Training", description: "Onboarding, lateral moves, role transitions, or one-on-one training for a single person.", icon: "👤", plan_type: "onboarding" },
  { id: "group", label: "Group / Cohort Training", description: "Multi-session training for a group or cohort — covers sessions, practice, and assessment.", icon: "👥", plan_type: "training" },
];

export default function TrainingPlanDialog({ open, onClose, onSave, editingPlan, employees = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    if (editingPlan) {
      setForm({ ...EMPTY, ...editingPlan });
      setMode(null);
    } else {
      setForm(EMPTY);
      setMode(null);
    }
  }, [editingPlan, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleModeSelect = (m) => {
    setMode(m.id);
    set("plan_type", m.plan_type);
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setForm(prev => ({
        ...prev,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_email: emp.email || "",
        previous_position: emp.position || "",
        department: emp.department || "",
        supervisor_name: prev.supervisor_name || emp.manager_email || "",
      }));
    }
  };

  const save = () => {
    if (!form.employee_name.trim() || !form.position_title.trim() || !form.start_date) return;
    onSave(form);
  };

  const isGroup = mode === "group" || form.plan_type === "training";
  const nameLabel = isGroup ? "Group / Cohort Name *" : "Employee Name *";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Edit Training Plan" : "New Training Plan"}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose individual vs group (new plans only) */}
        {!editingPlan && !mode && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">What type of training is this?</Label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeSelect(m)}
                  className="text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent/5 transition-all"
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <h4 className="text-sm font-semibold">{m.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Form (shown when editing, or when mode is chosen) */}
        {(editingPlan || mode) && (
          <div className="space-y-4">
            {/* Quick pick from existing employees (individual only) */}
            {employees.length > 0 && !editingPlan && mode === "individual" && (
              <div>
                <Label className="text-xs text-muted-foreground">Quick-pick existing staff member (optional)</Label>
                <select
                  className={`${selectClass} mt-1 text-muted-foreground`}
                  value=""
                  onChange={e => e.target.value && handleEmployeeSelect(e.target.value)}
                >
                  <option value="" disabled>Select an employee to auto-fill...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} — {emp.position}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{nameLabel}</Label>
                <Input value={form.employee_name} onChange={e => set("employee_name", e.target.value)} className="mt-1" placeholder={isGroup ? "e.g. Summer Staff Cohort" : "Full name"} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={form.employee_email} onChange={e => set("employee_email", e.target.value)} className="mt-1" placeholder={isGroup ? "Group contact email (optional)" : "work@email.ca"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Plan Type</Label>
                <select
                  className={`${selectClass} mt-1`}
                  value={form.plan_type}
                  onChange={e => set("plan_type", e.target.value)}
                >
                  {PLAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  className={`${selectClass} mt-1`}
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                >
                  {PLAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{isGroup ? "Training Program Title *" : "New Position Title *"}</Label>
                <Input value={form.position_title} onChange={e => set("position_title", e.target.value)} className="mt-1" placeholder={isGroup ? "e.g. Volunteer Training Program" : "e.g. Program Coordinator"} />
              </div>
              <div>
                <Label className="text-xs">Previous Position</Label>
                <Input value={form.previous_position} onChange={e => set("previous_position", e.target.value)} className="mt-1" placeholder="e.g. Frontline Worker" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Department</Label>
                <Input value={form.department} onChange={e => set("department", e.target.value)} className="mt-1" placeholder="e.g. Operations" />
              </div>
              <div>
                <Label className="text-xs">Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{isGroup ? "Training Lead Name" : "Supervisor Name"}</Label>
                <Input value={form.supervisor_name} onChange={e => set("supervisor_name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isGroup ? "Training Lead Email" : "Supervisor Email"}</Label>
                <Input value={form.supervisor_email} onChange={e => set("supervisor_email", e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Buddy / Mentor Name</Label>
                <Input value={form.buddy_mentor_name} onChange={e => set("buddy_mentor_name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Buddy / Mentor Email</Label>
                <Input value={form.buddy_mentor_email} onChange={e => set("buddy_mentor_email", e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Key Objectives — What does success look like?</Label>
              <Textarea value={form.key_objectives} onChange={e => set("key_objectives", e.target.value)} className="mt-1" rows={3} placeholder={isGroup ? "e.g. All participants complete the training, demonstrate competency in core skills, and receive certificates..." : "e.g. Comfortable running programs independently by week 2, understands reporting requirements, built relationships with key team members..."} />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" rows={2} />
            </div>

            {!editingPlan && (
              <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="text-xs">
                ← Back to training type selection
              </Button>
            )}
          </div>
        )}

        {(editingPlan || mode) && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!form.employee_name.trim() || !form.position_title.trim() || !form.start_date}>
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}