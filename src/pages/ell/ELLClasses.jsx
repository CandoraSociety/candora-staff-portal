import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Search, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const CLB_LEVELS = ["mixed", "clb_1", "clb_2", "clb_3", "clb_4", "clb_5", "clb_6", "clb_7", "clb_8", "clb_9", "clb_10", "clb_11", "clb_12"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const statusColors = {
  planning: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  completed: "bg-accent/10 text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive-foreground",
};

function ClassFormDialog({ cls, instructors, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: cls?.name || "",
    clb_level: cls?.clb_level || "mixed",
    description: cls?.description || "",
    instructor_id: cls?.instructor_id || "",
    schedule_days: cls?.schedule_days || [],
    start_time: cls?.start_time || "",
    end_time: cls?.end_time || "",
    location: cls?.location || "",
    capacity: cls?.capacity || 15,
    start_date: cls?.start_date || "",
    end_date: cls?.end_date || "",
    status: cls?.status || "planning",
  });

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      schedule_days: f.schedule_days.includes(day)
        ? f.schedule_days.filter((d) => d !== day)
        : [...f.schedule_days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Class name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const instructor = instructors?.find((i) => i.id === form.instructor_id);
      const payload = {
        ...form,
        instructor_name: instructor ? `${instructor.first_name} ${instructor.last_name}` : "",
      };
      if (cls) {
        await base44.entities.ELLClass.update(cls.id, payload);
        toast({ title: "Class updated" });
      } else {
        await base44.entities.ELLClass.create(payload);
        toast({ title: "Class created" });
      }
      queryClient.invalidateQueries(["ellClasses"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cls ? "Edit Class" : "Create Class"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Class Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CLB Level</Label>
              <Select value={form.clb_level} onValueChange={(v) => setForm({ ...form, clb_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ").toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["planning", "active", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Instructor</Label>
            <Select value={form.instructor_id} onValueChange={(v) => setForm({ ...form, instructor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
              <SelectContent>
                {instructors?.filter((i) => i.status === "active").map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Schedule Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    form.schedule_days.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({ cls, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);

  const handleDelete = async () => {
    try {
      await base44.entities.ELLClass.delete(cls.id);
      toast({ title: "Class deleted" });
      queryClient.invalidateQueries(["ellClasses"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete Class</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete "{cls.name}"? This cannot be undone.</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ELLClasses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [deleteClass, setDeleteClass] = useState(null);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["ellClasses"],
    queryFn: () => base44.entities.ELLClass.list("-created_date"),
  });

  const { data: instructors } = useQuery({
    queryKey: ["ellInstructors"],
    queryFn: () => base44.entities.ELLInstructor.list(),
  });

  const { data: learners } = useQuery({
    queryKey: ["ellLearners"],
    queryFn: () => base44.entities.ELLLearner.list(),
  });

  const getEnrolledCount = (classId) => learners?.filter((l) => l.assigned_class_id === classId).length || 0;

  const filtered = classes?.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage courses and class schedules</p>
        </div>
        <Button onClick={() => { setEditClass(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No classes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <Badge className={statusColors[cls.status] || "bg-muted text-muted-foreground"}>
                    {cls.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">{cls.clb_level?.replace("_", " ").toUpperCase()}</Badge>
                  {cls.instructor_name && <span className="text-xs">{cls.instructor_name}</span>}
                </div>
                {cls.schedule_days?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="capitalize text-xs">{cls.schedule_days.join(", ")}</span>
                    {cls.start_time && <span className="text-xs">{cls.start_time}{cls.end_time ? `–${cls.end_time}` : ""}</span>}
                  </div>
                )}
                {cls.location && <p className="text-sm text-muted-foreground">📍 {cls.location}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {getEnrolledCount(cls.id)} / {cls.capacity || "—"} enrolled
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditClass(cls); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteClass(cls)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <ClassFormDialog cls={editClass} instructors={instructors} onClose={() => { setShowForm(false); setEditClass(null); }} />}
      {deleteClass && <DeleteConfirmDialog cls={deleteClass} onClose={() => setDeleteClass(null)} />}
    </div>
  );
}