import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Wand2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  MODULE_CATEGORIES, DIFFICULTY_LEVELS,
} from "@/lib/trainingModuleConstants";

export default function ModuleAIGenerator({ open, onClose, onGenerated }) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("onboarding");
  const [difficulty, setDifficulty] = useState("beginner");
  const [audience, setAudience] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for the module.");
      return;
    }
    setGenerating(true);
    try {
      const prompt = `You are an expert instructional designer creating a training module for a Canadian non-profit community organization called Candora.

Create a complete training module on the following topic:

Topic: ${topic}
Category: ${category}
Difficulty level: ${difficulty}
Target audience: ${audience || "General staff and volunteers"}
Additional context: ${extraContext || "None"}

Generate a comprehensive, well-structured module that includes:
1. A clear, professional title and description
2. 4-6 specific, measurable learning objectives (starting with action verbs)
3. 6-10 presentation slides — each with a title, bullet points (3-5 concise points), and speaker notes for the presenter
4. 3-5 quiz questions with 4 options each, marking the correct answer, and an explanation

Guidelines:
- Use clear, accessible language suitable for the difficulty level
- Make content practical and actionable
- Speaker notes should guide the presenter on how to deliver the slide
- Quiz questions should test understanding, not just memorization
- Slides should flow logically: introduction → key topics → summary
- Keep bullet points concise (under 15 words each)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            duration_minutes: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            learning_objectives: { type: "array", items: { type: "string" } },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                  speaker_notes: { type: "string" },
                },
              },
            },
            quiz_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_index: { type: "number" },
                  explanation: { type: "string" },
                },
              },
            },
          },
        },
      });

      const slides = (result.slides || []).map((s, i) => ({
        id: crypto.randomUUID(),
        title: s.title || "",
        layout: "title_bullets",
        bullets: (s.bullets || []).filter(b => b && b.trim()),
        content_html: "",
        speaker_notes: s.speaker_notes || "",
        sort_order: i,
      }));

      const quiz = (result.quiz_questions || []).map(q => ({
        id: crypto.randomUUID(),
        question: q.question || "",
        options: (q.options || ["", "", "", ""]).slice(0, 4),
        correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
        explanation: q.explanation || "",
      }));

      onGenerated({
        title: result.title || topic,
        description: result.description || "",
        category,
        content_type: "presentation",
        difficulty,
        duration_minutes: result.duration_minutes || 30,
        tags: result.tags || [],
        learning_objectives: (result.learning_objectives || []).filter(o => o && o.trim()),
        slides,
        quiz_questions: quiz,
        content_html: "",
        status: "draft",
        version: 1,
      });

      toast.success("Module generated! Review and customize it in the editor.");
      onClose();
    } catch (err) {
      console.error("AI generation error:", err);
      toast.error("Failed to generate module. " + (err.message || "Please try again."));
    }
    setGenerating(false);
  };

  const suggestions = [
    "Workplace harassment prevention",
    "Fire safety and evacuation procedures",
    "Volunteer code of conduct",
    "Food safe handling basics",
    "Client confidentiality and privacy",
    "Inclusive communication practices",
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> AI Module Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Describe what you want to teach, and AI will generate a complete module with slides, learning objectives, and quiz questions. You can then review and edit everything before saving.
            </p>
          </div>

          <div>
            <Label className="mb-1 block text-sm">What do you want to teach? <span className="text-destructive">*</span></Label>
            <Textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. How to handle a client disclosure of domestic violence"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className="text-xs px-2 py-1 rounded-full border border-input bg-card hover:bg-muted text-muted-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">Category</Label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {MODULE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Difficulty</Label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent text-sm px-2">
                {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs">Target Audience (optional)</Label>
            <Input
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g. Front desk volunteers, kitchen staff, all employees"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs">Additional Context (optional)</Label>
            <Textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              rows={2}
              placeholder="Any specific points to cover, organizational context, or requirements..."
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={generating || !topic.trim()}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {generating ? "Generating..." : "Generate Module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}