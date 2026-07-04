import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PLAN_TYPES, PLAN_STATUSES } from "@/lib/trainingConstants";

const EMPTY = {
  employee_name: "",
  employee_email: "",
  plan_type: "lateral_move",
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

export default function TrainingPlanDialog({ open, onClose, onSave, editingPlan, employees = [] }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editingPlan) {
      setForm({ ...EMPTY, ...editingPlan });
    } else {
      setForm(EMPTY);
    }
  }, [editingPlan, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Edit Training Plan" : "New Training Plan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick pick from existing employees */}
          {employees.length > 0 && !editingPlan && (
            <div>
              <Label className="text-xs text-muted-foreground">Quick-pick existing staff member (optional)</Label>
              <Select onValueChange={handleEmployeeSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an employee to auto-fill..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} — {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Employee Name *</Label>
              <Input value={form.employee_name} onChange={e => set("employee_name", e.target.value)} className="mt-1" placeholder="Full name" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={form.employee_email} onChange={e => set("employee_email", e.target.value)} className="mt-1" placeholder="work@email.ca" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Plan Type</Label>
              <Select value={form.plan_type} onValueChange={v => set("plan_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">New Position Title *</Label>
              <Input value={form.position_title} onChange={e => set("position_title", e.target.value)} className="mt-1" placeholder="e.g. Program Coordinator" />
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
              <Label className="text-xs">Supervisor Name</Label>
              <Input value={form.supervisor_name} onChange={e => set("supervisor_name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Supervisor Email</Label>
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
            <Textarea value={form.key_objectives} onChange={e => set("key_objectives", e.target.value)} className="mt-1" rows={3} placeholder="e.g. Comfortable running programs independently by week 2, understands reporting requirements, built relationships with key team members..." />
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!form.employee_name.trim() || !form.position_title.trim() || !form.start_date}>
            {editingPlan ? "Update Plan" : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}