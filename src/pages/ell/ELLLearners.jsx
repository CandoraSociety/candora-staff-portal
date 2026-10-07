import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useEllRosters, LearnerRosterTable } from "@/components/ell/ELLLearnerRosterTabs";
import LearnerFormDialog from "@/components/ell/LearnerFormDialog";

const statusColors = {
  prospective: "bg-muted text-muted-foreground",
  waitlisted: "bg-warning/10 text-warning",
  enrolled: "bg-primary/10 text-primary",
  active: "bg-success/10 text-success",
  completed: "bg-accent/10 text-accent-foreground",
  withdrawn: "bg-destructive/10 text-destructive-foreground",
};

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
  const [tab, setTab] = useState("all");
  const rosters = useEllRosters();
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Learners</TabsTrigger>
          <TabsTrigger value="active">Active Learners ({rosters.activeLearners.length})</TabsTrigger>
          <TabsTrigger value="waitlisted">Waitlisted Learners ({rosters.waitlisted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
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
              <option value="waitlisted">Waitlisted</option>
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
                    <div key={learner.id} onClick={() => { setEditLearner(learner); setShowForm(true); }} className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors cursor-pointer">
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
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditLearner(learner); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteLearner(learner); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <LearnerRosterTable mode="active" learners={rosters.activeLearners} classById={rosters.classById} note={rosters.rosterNote} isLoading={rosters.isLoading} />
        </TabsContent>

        <TabsContent value="waitlisted" className="mt-4">
          <LearnerRosterTable mode="waitlisted" learners={rosters.waitlisted} isLoading={rosters.isLoading} />
        </TabsContent>
      </Tabs>

      {showForm && <LearnerFormDialog learner={editLearner} onClose={() => { setShowForm(false); setEditLearner(null); }} />}
      {deleteLearner && <DeleteConfirmDialog learner={deleteLearner} onClose={() => setDeleteLearner(null)} />}
    </div>
  );
}