import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ClipboardCheck, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const CLB_LEVELS = ["not_assessed", "clb_1", "clb_2", "clb_3", "clb_4", "clb_5", "clb_6", "clb_7", "clb_8", "clb_9", "clb_10", "clb_11", "clb_12"];

function AssessmentFormDialog({ assessment, learners, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    learner_id: assessment?.learner_id || "",
    assessment_date: assessment?.assessment_date || new Date().toISOString().split("T")[0],
    clb_level_before: assessment?.clb_level_before || "not_assessed",
    clb_level_after: assessment?.clb_level_after || "not_assessed",
    assessor_name: assessment?.assessor_name || "",
    notes: assessment?.notes || "",
  });

  const handleSave = async () => {
    if (!form.learner_id) {
      toast({ title: "Please select a learner", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const learner = learners?.find((l) => l.id === form.learner_id);
      const payload = {
        ...form,
        learner_name: learner ? `${learner.first_name} ${learner.last_name}` : "",
      };
      if (assessment) {
        await base44.entities.ELLAssessment.update(assessment.id, payload);
        toast({ title: "Assessment updated" });
      } else {
        await base44.entities.ELLAssessment.create(payload);
        // Also update learner's CLB level
        if (learner && form.clb_level_after !== "not_assessed") {
          await base44.entities.ELLLearner.update(learner.id, { clb_level: form.clb_level_after });
        }
        toast({ title: "Assessment recorded" });
      }
      queryClient.invalidateQueries(["ellAssessments"]);
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
          <DialogTitle>{assessment ? "Edit Assessment" : "New Assessment"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Learner *</Label>
            <Select value={form.learner_id} onValueChange={(v) => setForm({ ...form, learner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
              <SelectContent>
                {learners?.map((l) => <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assessment Date</Label>
              <Input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} />
            </div>
            <div>
              <Label>Assessor</Label>
              <Input value={form.assessor_name} onChange={(e) => setForm({ ...form, assessor_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CLB Level Before</Label>
              <Select value={form.clb_level_before} onValueChange={(v) => setForm({ ...form, clb_level_before: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ").toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CLB Level After</Label>
              <Select value={form.clb_level_after} onValueChange={(v) => setForm({ ...form, clb_level_after: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ").toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
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

function DeleteConfirmDialog({ assessment, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);

  const handleDelete = async () => {
    try {
      await base44.entities.ELLAssessment.delete(assessment.id);
      toast({ title: "Assessment deleted" });
      queryClient.invalidateQueries(["ellAssessments"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete Assessment</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Delete assessment for {assessment.learner_name}?</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ELLAssessments() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAssessment, setEditAssessment] = useState(null);
  const [deleteAssessment, setDeleteAssessment] = useState(null);

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["ellAssessments"],
    queryFn: () => base44.entities.ELLAssessment.list("-assessment_date"),
  });

  const { data: learners } = useQuery({
    queryKey: ["ellLearners"],
    queryFn: () => base44.entities.ELLLearner.list(),
  });

  const filtered = assessments?.filter((a) => {
    return a.learner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assessor_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Assessments</h1>
          <p className="text-muted-foreground">Track CLB level assessments and progress</p>
        </div>
        <Button onClick={() => { setEditAssessment(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search assessments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No assessments found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered?.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{a.learner_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.assessment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {a.assessor_name ? ` · Assessed by ${a.assessor_name}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{a.clb_level_before?.replace("_", " ").toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge className="bg-primary/10 text-primary text-xs">{a.clb_level_after?.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditAssessment(a); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteAssessment(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && <AssessmentFormDialog assessment={editAssessment} learners={learners} onClose={() => { setShowForm(false); setEditAssessment(null); }} />}
      {deleteAssessment && <DeleteConfirmDialog assessment={deleteAssessment} onClose={() => setDeleteAssessment(null)} />}
    </div>
  );
}