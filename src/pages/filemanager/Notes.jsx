import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import QuickNoteModal from "@/components/notes/QuickNoteModal";

export default function Notes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Note.list("-created_date", 100);
      return all.filter((n) => n.owner_email === user?.email);
    },
    enabled: !!user,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
  });

  const filteredNotes = notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">{notes.length} notes</p>
        </div>
        <Button onClick={() => { setEditingNote(null); setShowModal(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Note</Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No notes yet</p>
          <Button onClick={() => setShowModal(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create your first note</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{note.title}</CardTitle>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingNote(note)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => deleteNoteMutation.mutate(note.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]*>/g, "") }} />
                {note.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{note.tags.map((t, i) => <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded">{t}</span>)}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuickNoteModal open={showModal} onOpenChange={setShowModal} editingNote={editingNote} onClose={() => { setShowModal(false); setEditingNote(null); queryClient.invalidateQueries({ queryKey: ["notes"] }); }} />
    </div>
  );
}