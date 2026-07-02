import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UserCog, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

function InstructorFormDialog({ instructor, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: instructor?.first_name || "",
    last_name: instructor?.last_name || "",
    email: instructor?.email || "",
    phone: instructor?.phone || "",
    qualifications: instructor?.qualifications || "",
    status: instructor?.status || "active",
    notes: instructor?.notes || "",
  });

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (instructor) {
        await base44.entities.ELLInstructor.update(instructor.id, form);
        toast({ title: "Instructor updated" });
      } else {
        await base44.entities.ELLInstructor.create(form);
        toast({ title: "Instructor added" });
      }
      queryClient.invalidateQueries(["ellInstructors"]);
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
          <DialogTitle>{instructor ? "Edit Instructor" : "Add Instructor"}</DialogTitle>
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
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Qualifications</Label>
            <Input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} placeholder="e.g. TESL Certificate, CELTA" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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

function DeleteConfirmDialog({ instructor, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);

  const handleDelete = async () => {
    try {
      await base44.entities.ELLInstructor.delete(instructor.id);
      toast({ title: "Instructor deleted" });
      queryClient.invalidateQueries(["ellInstructors"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete Instructor</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete {instructor.first_name} {instructor.last_name}?</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ELLInstructors() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editInstructor, setEditInstructor] = useState(null);
  const [deleteInstructor, setDeleteInstructor] = useState(null);

  const { data: instructors, isLoading } = useQuery({
    queryKey: ["ellInstructors"],
    queryFn: () => base44.entities.ELLInstructor.list("-created_date"),
  });

  const { data: classes } = useQuery({
    queryKey: ["ellClasses"],
    queryFn: () => base44.entities.ELLClass.list(),
  });

  const getClassCount = (instructorId) => classes?.filter((c) => c.instructor_id === instructorId && c.status === "active").length || 0;

  const filtered = instructors?.filter((i) => {
    const fullName = `${i.first_name} ${i.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) ||
      i.email?.toLowerCase().includes(search.toLowerCase()) ||
      i.qualifications?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Instructors</h1>
          <p className="text-muted-foreground">Manage teaching staff</p>
        </div>
        <Button onClick={() => { setEditInstructor(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search instructors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No instructors found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((instructor) => (
            <Card key={instructor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-foreground font-medium">
                    {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm">{instructor.first_name} {instructor.last_name}</h4>
                      <Badge className={instructor.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                        {instructor.status}
                      </Badge>
                    </div>
                    {instructor.email && <p className="text-xs text-muted-foreground truncate">{instructor.email}</p>}
                    {instructor.phone && <p className="text-xs text-muted-foreground">{instructor.phone}</p>}
                    {instructor.qualifications && <p className="text-xs text-muted-foreground mt-1">{instructor.qualifications}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{getClassCount(instructor.id)} active class(es)</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditInstructor(instructor); setShowForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteInstructor(instructor)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <InstructorFormDialog instructor={editInstructor} onClose={() => { setShowForm(false); setEditInstructor(null); }} />}
      {deleteInstructor && <DeleteConfirmDialog instructor={deleteInstructor} onClose={() => setDeleteInstructor(null)} />}
    </div>
  );
}