import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2,
  BookOpen, Layers, Sparkles, Wand2, Eye,
  ChevronRight, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import ContentBlockRenderer from "@/components/lms/ContentBlockRenderer";
import ContentBlockPalette from "@/components/lms/ContentBlockPalette";
import ModulePreview from "@/components/lms/ModulePreview";
import {
  MODULE_CATEGORIES, DIFFICULTY_LEVELS, MODULE_STATUSES, NAVIGATION_MODES,
  getModuleStats,
  createEmptyChapter, createEmptySection, createEmptyBlock,
  updateChapter, updateSection, updateBlock, reorderArray,
} from "@/lib/lmsConstants";

const emptyModule = {
  title: "", description: "", category: "onboarding", difficulty: "beginner",
  duration_minutes: 0, status: "draft", version: 1, version_notes: "",
  version_locked: false, navigation_mode: "linear_review",
  tags: [], learning_objectives: [],
  chapters: [], thumbnail_url: "", created_by_name: "",
  program_id: "", program_title: "",
};

export default function ModuleAuthoring() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !moduleId || moduleId === "new";

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [expandedChapters, setExpandedChapters] = useState({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ["lms-programs"],
    queryFn: () => base44.entities.TrainingProgram.list(),
  });

  useEffect(() => {
    if (isNew) {
      setModule({ ...emptyModule, chapters: [createEmptyChapter(0)] });
      setExpandedChapters({ ["ch0"]: true });
      setLoading(false);
    } else {
      base44.entities.TrainingModule.get(moduleId).then(m => {
        const loaded = { ...emptyModule, ...m, chapters: m.chapters || [], learning_objectives: m.learning_objectives || [], tags: m.tags || [] };
        setModule(loaded);
        if (loaded.chapters.length > 0) {
          setExpandedChapters({ [`ch0`]: true });
        }
        setLoading(false);
      }).catch(() => {
        toast.error("Module not found");
        navigate("/lms/modules");
      });
    }
  }, [moduleId, isNew, navigate]);

  // Mark dirty on any change
  const update = useCallback((field, value) => {
    setModule(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  // Chapter operations
  const addChapter = () => {
    const newCh = createEmptyChapter(module.chapters.length);
    setModule(prev => ({ ...prev, chapters: [...prev.chapters, newCh] }));
    setExpandedChapters(prev => ({ ...prev, [`ch${module.chapters.length}`]: true }));
    setDirty(true);
  };

  const updateChapterTitle = (chId, title) => {
    setModule(prev => ({ ...prev, chapters: updateChapter(prev.chapters, chId, ch => ({ ...ch, title })) }));
    setDirty(true);
  };

  const deleteChapter = (chId) => {
    if (!confirm("Delete this chapter and all its sections?")) return;
    setModule(prev => ({ ...prev, chapters: prev.chapters.filter(ch => ch.id !== chId) }));
    setDirty(true);
  };

  const moveChapter = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= module.chapters.length) return;
    setModule(prev => ({ ...prev, chapters: reorderArray(prev.chapters, idx, ni) }));
    setDirty(true);
  };

  // Section operations
  const addSection = (chId) => {
    const newSec = createEmptySection(0);
    setModule(prev => ({
      ...prev,
      chapters: updateChapter(prev.chapters, chId, ch => ({
        ...ch,
        sections: [...(ch.sections || []), newSec]
      }))
    }));
    setDirty(true);
  };

  const updateSectionTitle = (chId, secId, title) => {
    setModule(prev => ({
      ...prev,
      chapters: updateSection(prev.chapters, chId, secId, sec => ({ ...sec, title }))
    }));
    setDirty(true);
  };

  const deleteSection = (chId, secId) => {
    if (!confirm("Delete this section and all its content blocks?")) return;
    setModule(prev => ({
      ...prev,
      chapters: updateChapter(prev.chapters, chId, ch => ({
        ...ch,
        sections: (ch.sections || []).filter(sec => sec.id !== secId)
      }))
    }));
    setDirty(true);
  };

  const moveSection = (chId, idx, dir) => {
    const ch = module.chapters.find(c => c.id === chId);
    if (!ch) return;
    const sections = ch.sections || [];
    const ni = idx + dir;
    if (ni < 0 || ni >= sections.length) return;
    setModule(prev => ({
      ...prev,
      chapters: updateChapter(prev.chapters, chId, c => ({
        ...c,
        sections: reorderArray(sections, idx, ni)
      }))
    }));
    setDirty(true);
  };

  // Content block operations
  const addBlock = (chId, secId, block) => {
    setModule(prev => ({
      ...prev,
      chapters: updateSection(prev.chapters, chId, secId, sec => ({
        ...sec,
        content_blocks: [...(sec.content_blocks || []), block]
      }))
    }));
    setDirty(true);
  };

  const updateBlockData = (chId, secId, blockId, updatedBlock) => {
    setModule(prev => ({
      ...prev,
      chapters: updateBlock(prev.chapters, chId, secId, blockId, () => updatedBlock)
    }));
    setDirty(true);
  };

  const deleteBlock = (chId, secId, blockId) => {
    setModule(prev => ({
      ...prev,
      chapters: updateSection(prev.chapters, chId, secId, sec => ({
        ...sec,
        content_blocks: (sec.content_blocks || []).filter(b => b.id !== blockId)
      }))
    }));
    setDirty(true);
  };

  const moveBlock = (chId, secId, idx, dir) => {
    const ch = module.chapters.find(c => c.id === chId);
    if (!ch) return;
    const sec = (ch.sections || []).find(s => s.id === secId);
    if (!sec) return;
    const blocks = sec.content_blocks || [];
    const ni = idx + dir;
    if (ni < 0 || ni >= blocks.length) return;
    setModule(prev => ({
      ...prev,
      chapters: updateSection(prev.chapters, chId, secId, s => ({
        ...s,
        content_blocks: reorderArray(blocks, idx, ni)
      }))
    }));
    setDirty(true);
  };

  // Learning objectives
  const addObjective = () => update("learning_objectives", [...(module.learning_objectives || []), ""]);
  const updateObjective = (idx, val) => {
    const arr = [...(module.learning_objectives || [])];
    arr[idx] = val;
    update("learning_objectives", arr);
  };
  const removeObjective = (idx) => update("learning_objectives", (module.learning_objectives || []).filter((_, i) => i !== idx));

  // Tags
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || (module.tags || []).includes(tag)) return;
    update("tags", [...(module.tags || []), tag]);
    setTagInput("");
  };

  // Save
  const handleSave = async () => {
    if (!module.title.trim()) { toast.error("Please enter a module title."); return; }
    setSaving(true);
    try {
      const payload = {
        ...module,
        learning_objectives: (module.learning_objectives || []).filter(o => o.trim()),
        chapters: (module.chapters || []).map((ch, ci) => ({
          ...ch,
          sort_order: ci,
          sections: (ch.sections || []).map((sec, si) => ({
            ...sec,
            sort_order: si,
            content_blocks: (sec.content_blocks || []).map((blk, bi) => ({ ...blk, sort_order: bi }))
          }))
        })),
      };
      if (isNew) {
        const created = await base44.entities.TrainingModule.create(payload);
        qc.invalidateQueries({ queryKey: ["lms-modules"] });
        toast.success("Module created!");
        navigate(`/lms/modules/${created.id}/edit`);
      } else {
        await base44.entities.TrainingModule.update(moduleId, payload);
        qc.invalidateQueries({ queryKey: ["lms-modules"] });
        toast.success("Module saved!");
      }
      setDirty(false);
    } catch (err) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  // AI outline generation
  const handleAIGenerate = async () => {
    if (!module.title.trim()) { toast.error("Enter a module title first."); return; }
    setAiGenerating(true);
    try {
      const prompt = `You are an expert instructional designer. Create a module outline for a training module.

Title: ${module.title}
Description: ${module.description || "N/A"}
Category: ${module.category}
Difficulty: ${module.difficulty}

Generate 3-5 chapters, each with 1-3 sections. For each section, suggest what type of content block would work well.

Return JSON with this structure:
{
  "learning_objectives": ["3-5 measurable objectives starting with action verbs"],
  "chapters": [
    {
      "title": "Chapter title",
      "sections": [
        {
          "title": "Section title",
          "suggested_blocks": ["rich_text", "callout", "knowledge_check"]
        }
      ]
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            learning_objectives: { type: "array", items: { type: "string" } },
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        suggested_blocks: { type: "array", items: { type: "string" } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const newChapters = (result.chapters || []).map((ch, ci) => ({
        ...createEmptyChapter(ci),
        title: ch.title,
        sections: (ch.sections || []).map((sec, si) => ({
          ...createEmptySection(si),
          title: sec.title,
          content_blocks: (sec.suggested_blocks || []).slice(0, 1).map((bt, bi) => createEmptyBlock(bt, bi))
        }))
      }));

      const objectives = (result.learning_objectives || []).filter(o => o.trim());

      setModule(prev => ({
        ...prev,
        learning_objectives: objectives.length > 0 ? objectives : prev.learning_objectives,
        chapters: newChapters.length > 0 ? newChapters : prev.chapters
      }));
      setDirty(true);
      setExpandedChapters({ ch0: true });
      toast.success("AI outline generated! Review and customize each section.");
    } catch (err) {
      toast.error("AI generation failed: " + (err.message || "Unknown error"));
    }
    setAiGenerating(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = getModuleStats(module);

  if (previewMode) {
    return <ModulePreview module={module} onExit={() => setPreviewMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/lms/modules"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Library</Button></Link>
          <div className="h-5 w-px bg-border" />
          <input
            type="text"
            value={module.title}
            onChange={e => update("title", e.target.value)}
            placeholder="Module title..."
            className="text-lg font-bold bg-transparent border-none outline-none focus:ring-0 px-0 w-full max-w-md"
          />
          {dirty && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Unsaved</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAiOpen(!aiOpen)}>
            <Wand2 className="w-3.5 h-3.5 mr-1" /> AI Assist
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !module.title.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {/* AI Assist panel */}
      {aiOpen && (
        <div className="bg-primary/5 border-b px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">AI Module Outline Generator</p>
                <p className="text-xs text-muted-foreground mb-2">Generate a chapter/section structure with suggested content blocks based on your module title and description. You can customize everything after.</p>
                <Button size="sm" onClick={handleAIGenerate} disabled={aiGenerating}>
                  {aiGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                  {aiGenerating ? "Generating..." : "Generate Outline"}
                </Button>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAiOpen(false)}><ChevronUp className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Module details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Module Details</h3>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea value={module.description || ""} onChange={e => update("description", e.target.value)} rows={2} placeholder="Short summary of what this module covers" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <select value={module.category} onChange={e => update("category", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                  {MODULE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Difficulty</Label>
                <select value={module.difficulty} onChange={e => update("difficulty", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                  {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Duration (min)</Label>
                <Input type="number" min="0" value={module.duration_minutes} onChange={e => update("duration_minutes", parseInt(e.target.value) || 0)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Status</Label>
                <select value={module.status} onChange={e => update("status", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                  {MODULE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Navigation Mode</Label>
              <select value={module.navigation_mode || "linear_review"} onChange={e => update("navigation_mode", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {NAVIGATION_MODES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {NAVIGATION_MODES.find(n => n.value === (module.navigation_mode || "linear_review"))?.description}
                {(module.navigation_mode || "linear_review") !== "flexible" && " Interactive blocks (accordions, dynamic reveals, quizzes, checklists) must be completed before advancing."}
              </p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Program (optional)</Label>
              <select
                value={module.program_id || ""}
                onChange={e => {
                  const prog = programs.find(p => p.id === e.target.value);
                  update("program_id", e.target.value);
                  update("program_title", prog?.title || "");
                }}
                className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2"
              >
                <option value="">— No specific program —</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Assign this module to a specific program for easier grouping in the library.</p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter" className="text-sm" />
                <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {module.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {module.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => update("tags", module.tags.filter(t => t !== tag))}>
                      {tag} <span className="ml-1 text-xs">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Learning objectives */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Learning Objectives</h3>
              <Button size="sm" variant="outline" onClick={addObjective}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
            </div>
            <p className="text-xs text-muted-foreground">What will the learner be able to do after this module? Start each with an action verb.</p>
            {(module.learning_objectives || []).length === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic py-2 text-center">No objectives yet. Aim for 3-5 clear objectives.</p>
            ) : (
              (module.learning_objectives || []).map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-muted-foreground mt-2.5 w-5 shrink-0">{idx + 1}.</span>
                  <Textarea value={obj} onChange={e => updateObjective(idx, e.target.value)} rows={1} placeholder="e.g. Identify common workplace hazards" className="text-sm" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeObjective(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chapter/Section/Content builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Content Structure
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.chapters} chapter(s) · {stats.sections} section(s) · {stats.blocks} content block(s) · {stats.quizBlocks} quiz/check(s)
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={addChapter}><Plus className="w-3.5 h-3.5 mr-1" /> Add Chapter</Button>
          </div>

          {(module.chapters || []).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No chapters yet. Add your first chapter to start building content.</p>
                <Button size="sm" onClick={addChapter}><Plus className="w-3.5 h-3.5 mr-1" /> Add First Chapter</Button>
              </CardContent>
            </Card>
          )}

          {(module.chapters || []).map((chapter, chIdx) => {
            const chKey = `ch${chIdx}`;
            const isExpanded = expandedChapters[chKey];
            const chStats = {
              sections: (chapter.sections || []).length,
              blocks: (chapter.sections || []).reduce((sum, sec) => sum + (sec.content_blocks || []).length, 0)
            };
            return (
              <Card key={chapter.id} className="overflow-hidden">
                {/* Chapter header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
                  <button onClick={() => setExpandedChapters(prev => ({ ...prev, [chKey]: !prev[chKey] }))} className="p-0.5 hover:bg-muted rounded">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-bold text-muted-foreground shrink-0">Ch {chIdx + 1}</span>
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={e => updateChapterTitle(chapter.id, e.target.value)}
                    placeholder="Chapter title..."
                    className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-0 px-0"
                  />
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{chStats.sections} sec · {chStats.blocks} blocks</span>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveChapter(chIdx, -1)} disabled={chIdx === 0}><ChevronUp className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveChapter(chIdx, 1)} disabled={chIdx === module.chapters.length - 1}><ChevronDown className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteChapter(chapter.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>

                {/* Chapter content (sections) */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {(chapter.sections || []).length === 0 && (
                      <p className="text-xs text-muted-foreground/60 italic text-center py-2">No sections yet. Add a section to start adding content blocks.</p>
                    )}
                    {(chapter.sections || []).map((section, secIdx) => (
                      <div key={section.id} className="border rounded-lg overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-b">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{chIdx + 1}.{secIdx + 1}</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={e => updateSectionTitle(chapter.id, section.id, e.target.value)}
                            placeholder="Section title..."
                            className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 px-0"
                          />
                          <div className="flex items-center gap-0.5">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(chapter.id, secIdx, -1)} disabled={secIdx === 0}><ChevronUp className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(chapter.id, secIdx, 1)} disabled={secIdx === (chapter.sections || []).length - 1}><ChevronDown className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteSection(chapter.id, section.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>

                        {/* Content blocks */}
                        <div className="p-3 space-y-2">
                          {(section.content_blocks || []).length === 0 && (
                            <p className="text-xs text-muted-foreground/60 italic text-center py-2">No content yet. Add your first content block below.</p>
                          )}
                          {(section.content_blocks || []).map((block, blkIdx) => (
                            <ContentBlockRenderer
                              key={block.id}
                              block={block}
                              onChange={(updated) => updateBlockData(chapter.id, section.id, block.id, updated)}
                              onDelete={() => deleteBlock(chapter.id, section.id, block.id)}
                              onMoveUp={() => moveBlock(chapter.id, section.id, blkIdx, -1)}
                              onMoveDown={() => moveBlock(chapter.id, section.id, blkIdx, 1)}
                              canMoveUp={blkIdx > 0}
                              canMoveDown={blkIdx < (section.content_blocks || []).length - 1}
                            />
                          ))}
                          <ContentBlockPalette onAdd={(block) => addBlock(chapter.id, section.id, block)} />
                        </div>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full border-dashed" onClick={() => addSection(chapter.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Bottom save bar */}
        {dirty && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-medium">You have unsaved changes</span>
              <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}