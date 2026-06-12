import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles, List, Grid, ChevronDown, ChevronUp, Eye, EyeOff, Check, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function NotesTab({ notes = [], onChange }) {
  const [newNote, setNewNote] = useState("");
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedNotes, setExpandedNotes] = useState({});

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const rawEntry = newNote.trim();
    const newNoteObj = {
      id: `note_${Date.now()}`,
      raw_entry: rawEntry,
      subject: "Processing...",
      formatted: "AI is organizing this note...",
      created_at: new Date().toISOString(),
    };

    onChange([...notes, newNoteObj]);
    setNewNote("");
    setIsOrganizing(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Organize this brain dump note into a clear subject heading and formatted content. Return JSON with "subject" (short title) and "formatted" (markdown-formatted content). Note: "${rawEntry}"`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            formatted: { type: "string" }
          }
        }
      });

      onChange(currentNotes => currentNotes.map(n =>
        n.id === newNoteObj.id
          ? { ...n, subject: result.subject, formatted: result.formatted }
          : n
      ));
    } catch (error) {
      onChange(currentNotes => currentNotes.map(n =>
        n.id === newNoteObj.id
          ? { ...n, subject: "Unprocessed", formatted: rawEntry }
          : n
      ));
    } finally {
      setIsOrganizing(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteNote = (id) => {
    onChange(notes.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Brain Dump Notes</h3>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-7 px-2"
          >
            <List className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-7 px-2"
          >
            <Grid className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Dump your thoughts here... AI will organize them"
          className="min-h-[80px] resize-none"
          disabled={isOrganizing}
        />
        <div className="flex justify-end">
          <Button onClick={handleAddNote} disabled={!newNote.trim() || isOrganizing} size="sm">
            {isOrganizing ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
            {isOrganizing ? "Organizing..." : "Add Note"}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No notes yet. Start brain dumping!
        </div>
      ) : (
        <div className={viewMode === "list" ? "space-y-2" : "grid grid-cols-2 gap-3"}>
          {notes.map((note) => (
            <Card key={note.id} className={viewMode === "card" ? "" : "hover:bg-muted/30 transition-colors"}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{note.subject}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{note.raw_entry}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(note.id)}>
                      {expandedNotes[note.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNote(note.id)}>
                      <ChevronDown className="w-3 h-3 rotate-90" />
                    </Button>
                  </div>
                </div>
                {expandedNotes[note.id] && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div>
                      <p className="text-xs font-medium mb-1">Original:</p>
                      <p className="text-xs text-muted-foreground">{note.raw_entry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Organized:</p>
                      <div className="text-xs prose prose-sm max-w-none">
                        <ReactMarkdown>{note.formatted}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}