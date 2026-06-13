import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Pin, Sparkles, Loader2, Mic, Image, StickyNote } from "lucide-react";
import { format } from "date-fns";

const NOTE_TYPES = ["idea", "meeting", "action_item", "reflection", "general"];
const TYPE_COLORS = { idea: "bg-yellow-100 text-yellow-700", meeting: "bg-blue-100 text-blue-700", action_item: "bg-red-100 text-red-700", reflection: "bg-purple-100 text-purple-700", general: "bg-muted text-muted-foreground" };
const FORMATS = ["text", "voice", "photo"];

const EMPTY = { title: "", content: "", note_type: "general", format: "text", subject: "", tags: [], is_pinned: false, file_url: "" };

export default function EDNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [aiLoading, setAiLoading] = useState(null);
  const [viewNote, setViewNote] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const { data: notes = [] } = useQuery({ queryKey: ["ed-notes"], queryFn: () => base44.entities.EDNote.list() });

  const save = async () => {
    if (!form.title.trim()) return;
    if (editId) await base44.entities.EDNote.update(editId, form);
    else await base44.entities.EDNote.create({ ...form, owner_id: user?.id });
    qc.invalidateQueries({ queryKey: ["ed-notes"] });
    setOpen(false); setForm(EMPTY); setEditId(null);
  };

  const del = async (id) => { await base44.entities.EDNote.delete(id); qc.invalidateQueries({ queryKey: ["ed-notes"] }); };
  const openEdit = (n) => { setForm({ ...n, tags: n.tags || [] }); setEditId(n.id); setOpen(true); };
  const togglePin = async (n) => { await base44.entities.EDNote.update(n.id, { is_pinned: !n.is_pinned }); qc.invalidateQueries({ queryKey: ["ed-notes"] }); };

  const autoTag = async (note) => {
    setAiLoading(note.id);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Given this note titled "${note.title}" with content: "${note.content || "no content"}", suggest:\n1. A note_type from: ${NOTE_TYPES.join(", ")}\n2. A short subject category (2-3 words)\n3. 3 relevant tags\nRespond as JSON: {"note_type": "", "subject": "", "tags": []}`,
      response_json_schema: { type: "object", properties: { note_type: { type: "string" }, subject: { type: "string" }, tags: { type: "array", items: { type: "string" } } } }
    });
    await base44.entities.EDNote.update(note.id, { note_type: res.note_type || note.note_type, subject: res.subject || note.subject, tags: res.tags || note.tags });
    qc.invalidateQueries({ queryKey: ["ed-notes"] });
    setAiLoading(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    if (file.type.startsWith("image/")) {
      setForm(f => ({ ...f, format: "photo" }));
    }
    setUploading(false);
  };

  const transcribeVoice = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    setForm(f => ({ ...f, content: (f.content ? f.content + "\n\n" : "") + transcript, format: "voice", file_url }));
    setUploading(false);
  };

  const filtered = notes
    .filter(n => filterType === "all" || n.note_type === filterType)
    .filter(n => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.updated_date) - new Date(a.updated_date));

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Notes</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 w-40" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {NOTE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No notes yet.</p>}
        {filtered.map(note => (
          <Card key={note.id} className={`group cursor-pointer hover:shadow-md transition-shadow ${note.is_pinned ? "ring-2 ring-amber-300" : ""}`} onClick={() => setViewNote(note)}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  {note.subject && <p className="text-xs text-muted-foreground">{note.subject}</p>}
                </div>
                {note.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />}
              </div>
              {note.content && <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[note.note_type] || TYPE_COLORS.general}`}>{(note.note_type || "general").replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(note.updated_date || note.created_date), "MMM d")}</span>
              </div>
              {(note.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => autoTag(note)} disabled={aiLoading === note.id}>
                  {aiLoading === note.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(note)}>
                  <Pin className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(note)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => del(note.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View dialog */}
      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewNote?.title}</DialogTitle></DialogHeader>
          {viewNote && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[viewNote.note_type] || TYPE_COLORS.general}`}>{(viewNote.note_type || "general").replace("_", " ")}</span>
                {viewNote.subject && <Badge variant="outline">{viewNote.subject}</Badge>}
              </div>
              {viewNote.content && <p className="text-sm whitespace-pre-wrap">{viewNote.content}</p>}
              {viewNote.file_url && viewNote.format === "photo" && <img src={viewNote.file_url} className="rounded-lg max-h-64 object-cover" alt="note attachment" />}
              {(viewNote.tags || []).length > 0 && <div className="flex flex-wrap gap-1">{viewNote.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.note_type} onValueChange={v => setForm({ ...form, note_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NOTE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Subject category" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <Input placeholder="Tags (comma separated)" value={(form.tags || []).join(", ")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} />
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Image className="w-3.5 h-3.5 mr-1" /> {uploading ? "Uploading..." : "Attach Photo"}
              </Button>
              <input type="file" className="hidden" id="voice-upload" accept="audio/*" onChange={transcribeVoice} />
              <Button size="sm" variant="outline" asChild>
                <label htmlFor="voice-upload" className="cursor-pointer">
                  <Mic className="w-3.5 h-3.5 mr-1" /> Transcribe Audio
                </label>
              </Button>
            </div>
            {form.file_url && form.format === "photo" && <img src={form.file_url} className="rounded-lg max-h-32 object-cover" alt="attachment" />}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}