import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const CLB_LEVELS = ["not_assessed", "clb_1", "clb_2", "clb_3", "clb_4", "clb_5", "clb_6", "clb_7", "clb_8", "clb_9", "clb_10", "clb_11", "clb_12"];

const statusColors = {
  prospective: "bg-muted text-muted-foreground",
  enrolled: "bg-primary/10 text-primary",
  active: "bg-success/10 text-success",
  completed: "bg-accent/10 text-accent-foreground",
  withdrawn: "bg-destructive/10 text-destructive-foreground",
};

function LearnerFormDialog({ learner, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: learner?.first_name || "",
    last_name: learner?.last_name || "",
    date_of_birth: learner?.date_of_birth || "",
    phone: learner?.phone || "",
    email: learner?.email || "",
    country_of_origin: learner?.country_of_origin || "",
    first_language: learner?.first_language || "",
    clb_level: learner?.clb_level || "not_assessed",
    enrollment_status: learner?.enrollment_status || "prospective",
    intake_date: learner?.intake_date || new Date().toISOString().split("T")[0],
    referral_source: learner?.referral_source || "",
    notes: learner?.notes || "",
  });

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (learner) {
        await base44.entities.ELLLearner.update(learner.id, form);
        toast({ title: "Learner updated" });
      } else {
        await base44.entities.ELLLearner.create(form);
        toast({ title: "Learner added" });
      }
      queryClient.invalidateQueries(["ellLearners"]);
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
          <DialogTitle>{learner ? "Edit Learner" : "Add Learner"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country of Origin</Label>
              <Input value={form.country_of_origin} onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })} />
            </div>
            <div>
              <Label>First Language</Label>
              <Input value={form.first_language} onChange={(e) => setForm({ ...form, first_language: e.target.value })} />
            </div>
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
              <Label>Enrollment Status</Label>
              <Select value={form.enrollment_status} onValueChange={(v) => setForm({ ...form, enrollment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["prospective", "enrolled", "active", "completed", "withdrawn"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Intake Date</Label>
              <Input type="date" value={form.intake_date} onChange={(e) => setForm({ ...form, intake_date: e.target.value })} />
            </div>
            <div>
              <Label>Referral Source</Label>
              <Input value={form.referral_source} onChange={(e) => setForm({ ...form, referral_source: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

function DeleteConfirmDialog({ learner, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);

  const handleDelete = async () => {
    try {
      await base44.entities.ELLLearner.delete(learner.id);
      toast({ title: "Learner deleted" });
      queryClient.invalidateQueries(["ellLearners"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Learner</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete {learner.first_name} {learner.last_name}? This cannot be undone.</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ELLLearners() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editLearner, setEditLearner] = useState(null);
  const [deleteLearner, setDeleteLearner] = useState(null);

  const { data: learners, isLoading } = useQuery({
    queryKey: ["ellLearners"],
    queryFn: () => base44.entities.ELLLearner.list("-created_date"),
  });

  const filtered = learners?.filter((l) => {
    const fullName = `${l.first_name} ${l.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.country_of_origin?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.enrollment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Learners</h1>
          <p className="text-muted-foreground">Manage student enrollments and profiles</p>
        </div>
        <Button onClick={() => { setEditLearner(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Learner
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search learners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="prospective">Prospective</option>
          <option value="enrolled">Enrolled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No learners found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered?.map((learner) => (
                <div key={learner.id} className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {learner.first_name?.[0]}{learner.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{learner.first_name} {learner.last_name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {learner.clb_level?.replace("_", " ").toUpperCase()}
                        {learner.country_of_origin ? ` · ${learner.country_of_origin}` : ""}
                        {learner.email ? ` · ${learner.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[learner.enrollment_status] || "bg-muted text-muted-foreground"}>
                      {learner.enrollment_status}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => { setEditLearner(learner); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteLearner(learner)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && <LearnerFormDialog learner={editLearner} onClose={() => { setShowForm(false); setEditLearner(null); }} />}
      {deleteLearner && <DeleteConfirmDialog learner={deleteLearner} onClose={() => setDeleteLearner(null)} />}
    </div>
  );
}