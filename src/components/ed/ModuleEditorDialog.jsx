import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, Loader2, GripVertical, ChevronUp, ChevronDown, Link2, FileText, Video, Presentation, Info } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import SlideBuilder from "./SlideBuilder";
import {
  MODULE_CATEGORIES, CONTENT_TYPES, DIFFICULTY_LEVELS, MODULE_STATUSES,
} from "@/lib/trainingModuleConstants";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image", "video"],
    ["blockquote", "code-block"],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const emptyModule = {
  title: "", description: "", category: "onboarding", content_type: "rich_text",
  content_html: "", slides: [], duration_minutes: 0, difficulty: "beginner",
  tags: [], file_attachments: [], learning_objectives: [], quiz_questions: [],
  status: "draft", version: 1,
};

export default function ModuleEditorDialog({ open, onClose, onSave, editingModule, prefillData }) {
  const [form, setForm] = useState(emptyModule);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (editingModule) {
      setForm({ ...emptyModule, ...editingModule, slides: editingModule.slides || [] });
    } else if (prefillData) {
      setForm({ ...emptyModule, ...prefillData, slides: prefillData.slides || [] });
    } else {
      setForm(emptyModule);
    }
    setActiveTab("details");
  }, [editingModule, prefillData, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!form.tags.includes(tag)) update("tags", [...form.tags, tag]);
    setTagInput("");
  };

  const addObjective = () => update("learning_objectives", [...form.learning_objectives, ""]);

  const addQuizQuestion = () => update("quiz_questions", [
    ...form.quiz_questions,
    { id: crypto.randomUUID(), question: "", options: ["", ""], correct_index: 0, explanation: "" },
  ]);

  const updateQuizQuestion = (idx, field, value) => {
    const qs = [...form.quiz_questions];
    qs[idx] = { ...qs[idx], [field]: value };
    update("quiz_questions", qs);
  };

  const updateQuizOption = (qIdx, oIdx, value) => {
    const qs = [...form.quiz_questions];
    const opts = [...qs[qIdx].options];
    opts[oIdx] = value;
    qs[qIdx] = { ...qs[qIdx], options: opts };
    update("quiz_questions", qs);
  };

  const addQuizOption = (qIdx) => {
    const qs = [...form.quiz_questions];
    qs[qIdx] = { ...qs[qIdx], options: [...qs[qIdx].options, ""] };
    update("quiz_questions", qs);
  };

  const removeQuizOption = (qIdx, oIdx) => {
    const qs = [...form.quiz_questions];
    const opts = qs[qIdx].options.filter((_, i) => i !== oIdx);
    const newCorrect = oIdx < qs[qIdx].correct_index
      ? qs[qIdx].correct_index - 1
      : (oIdx === qs[qIdx].correct_index ? 0 : qs[qIdx].correct_index);
    qs[qIdx] = { ...qs[qIdx], options: opts, correct_index: newCorrect };
    update("quiz_questions", qs);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const fileType = file.type.startsWith("video") ? "video"
          : file.type.includes("presentation") || file.name.match(/\.(pptx?|key)$/i) ? "slides"
          : file.type.startsWith("image") ? "image"
          : "document";
        uploaded.push({ id: crypto.randomUUID(), url: file_url, name: file.name, file_type: fileType });
      }
      update("file_attachments", [...form.file_attachments, ...uploaded]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file(s). Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (id) => update("file_attachments", form.file_attachments.filter(a => a.id !== id));

  const moveAttachment = (idx, dir) => {
    const arr = [...form.file_attachments];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    update("file_attachments", arr);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Please enter a module title."); setActiveTab("details"); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags, learning_objectives: form.learning_objectives.filter(o => o.trim()) };
      if (editingModule) {
        await base44.entities.TrainingModule.update(editingModule.id, payload);
      } else {
        await base44.entities.TrainingModule.create(payload);
      }
      onSave();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save module: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const attachmentIcon = (type) => {
    if (type === "video") return <Video className="w-4 h-4 text-red-500" />;
    if (type === "slides") return <Presentation className="w-4 h-4 text-orange-500" />;
    if (type === "image") return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const hasSlides = form.slides?.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingModule ? "Edit Module" : prefillData ? "Review & Customize Module" : "New Training Module"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="slides">Slides {hasSlides && <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{form.slides.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-3 pr-1">
            {/* DETAILS TAB */}
            <TabsContent value="details" className="space-y-4 mt-0">
              {!editingModule && !prefillData && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-0.5">How to build a module:</p>
                    <p>1. Fill in the <strong>Details</strong> below · 2. Create <strong>Slides</strong> for the presentation · 3. Write <strong>Content</strong> for reference materials · 4. Add <strong>Learning Objectives</strong> · 5. Create <strong>Quiz</strong> questions to test understanding</p>
                  </div>
                </div>
              )}
              {prefillData && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium mb-0.5">Content pre-filled — please review before saving</p>
                    <p>Review each tab (Details, Slides, Content, Objectives, Quiz) and make any adjustments, then click Create Module when ready.</p>
                  </div>
                </div>
              )}
              <div>
                <Label className="mb-1 block">Title <span className="text-destructive">*</span></Label>
                <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Workplace Safety Fundamentals" />
              </div>
              <div>
                <Label className="mb-1 block">Description</Label>
                <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} placeholder="Short summary of what this module covers" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">Category</Label>
                  <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                    {MODULE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Content Type</Label>
                  <select value={form.content_type} onChange={e => update("content_type", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                    {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Difficulty</Label>
                  <select value={form.difficulty} onChange={e => update("difficulty", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                    {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Duration (min)</Label>
                  <Input type="number" min="0" value={form.duration_minutes} onChange={e => update("duration_minutes", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Status</Label>
                  <select value={form.status} onChange={e => update("status", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                    {MODULE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Version</Label>
                  <Input type="number" min="1" value={form.version} onChange={e => update("version", parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter" />
                  <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => update("tags", form.tags.filter(t => t !== tag))}>
                        {tag} <span className="ml-1 text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SLIDES TAB */}
            <TabsContent value="slides" className="mt-0">
              <div className="mb-3 flex items-start gap-2 bg-muted/50 border rounded-lg p-3">
                <Presentation className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Build presentation slides directly in the module — no external software needed. Choose a layout for each slide, add bullet points or rich text, write speaker notes, and click Preview to see how it looks.
                </p>
              </div>
              <SlideBuilder
                slides={form.slides || []}
                onChange={(slides) => update("slides", slides)}
              />
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="mt-0">
              <div className="mb-2 text-xs text-muted-foreground">Write the lesson content below. This is the reference material learners can read alongside the slides. You can include text, images, links, and embedded videos.</div>
              <div className="border rounded-md overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={form.content_html}
                  onChange={html => update("content_html", html)}
                  modules={quillModules}
                  style={{ minHeight: "300px" }}
                />
              </div>
            </TabsContent>

            {/* FILES TAB */}
            <TabsContent value="files" className="space-y-3 mt-0">
              <div>
                <Label className="mb-2 block text-xs">Attach external slides, videos, documents, or images</Label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Uploading...</span></>
                  ) : (
                    <><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload files</span></>
                  )}
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
              {form.file_attachments.length > 0 && (
                <div className="space-y-2">
                  {form.file_attachments.map((att, idx) => (
                    <div key={att.id} className="flex items-center gap-3 border rounded-lg p-2.5 bg-card">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                      {attachmentIcon(att.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{att.file_type}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveAttachment(idx, -1)} disabled={idx === 0}><ChevronUp className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveAttachment(idx, 1)} disabled={idx === form.file_attachments.length - 1}><ChevronDown className="w-3.5 h-3.5" /></Button>
                        <a href={att.url} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" className="h-7 w-7"><Link2 className="w-3.5 h-3.5" /></Button></a>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeAttachment(att.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* OBJECTIVES TAB */}
            <TabsContent value="objectives" className="space-y-2 mt-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Learning Objectives</Label>
                <Button type="button" size="sm" variant="outline" onClick={addObjective}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <p className="text-xs text-muted-foreground">What will the learner be able to do after completing this module? Start each objective with an action verb (e.g. "Identify", "Demonstrate", "Explain").</p>
              {form.learning_objectives.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 italic py-4 text-center">No objectives added yet. Aim for 3-5 clear objectives.</p>
              ) : (
                form.learning_objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-2.5 w-5 shrink-0">{idx + 1}.</span>
                    <Textarea value={obj} onChange={e => { const arr = [...form.learning_objectives]; arr[idx] = e.target.value; update("learning_objectives", arr); }} rows={1} placeholder="e.g. Identify common workplace hazards" className="text-sm" />
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => update("learning_objectives", form.learning_objectives.filter((_, i) => i !== idx))}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))
              )}
            </TabsContent>

            {/* QUIZ TAB */}
            <TabsContent value="quiz" className="space-y-3 mt-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Quiz Questions (Optional)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addQuizQuestion}><Plus className="w-3.5 h-3.5 mr-1" /> Add Question</Button>
              </div>
              <p className="text-xs text-muted-foreground">Add 3-5 knowledge-check questions to test understanding. Mark the correct answer by clicking the circle next to it.</p>
              {form.quiz_questions.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 italic py-4 text-center">No quiz questions yet. Add knowledge-check questions to test understanding.</p>
              ) : (
                form.quiz_questions.map((q, qIdx) => (
                  <div key={q.id} className="border rounded-lg p-3 space-y-2 bg-card">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-muted-foreground mt-2.5 shrink-0">Q{qIdx + 1}</span>
                      <Input value={q.question} onChange={e => updateQuizQuestion(qIdx, "question", e.target.value)} placeholder="Question text" className="text-sm" />
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => update("quiz_questions", form.quiz_questions.filter((_, i) => i !== qIdx))}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2 ml-6">
                        <button type="button" onClick={() => updateQuizQuestion(qIdx, "correct_index", oIdx)} className={`w-4 h-4 rounded-full border-2 shrink-0 ${q.correct_index === oIdx ? "border-green-500 bg-green-500" : "border-slate-300"}`} title="Mark as correct answer" />
                        <Input value={opt} onChange={e => updateQuizOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className="text-sm h-8" />
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeQuizOption(qIdx, oIdx)} disabled={q.options.length <= 2}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center ml-6">
                      <Button type="button" size="sm" variant="ghost" onClick={() => addQuizOption(qIdx)}><Plus className="w-3 h-3 mr-1" /> Add Option</Button>
                      <span className="text-[11px] text-muted-foreground">Click the circle to mark the correct answer</span>
                    </div>
                    <Input value={q.explanation} onChange={e => updateQuizQuestion(qIdx, "explanation", e.target.value)} placeholder="Explanation (shown after answering)" className="text-sm ml-6" />
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {form.slides?.length || 0} slide(s) · {form.file_attachments.length} file(s) · {form.quiz_questions.length} quiz Q(s) · {form.learning_objectives.length} objective(s)
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingModule ? "Save Changes" : "Create Module"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}