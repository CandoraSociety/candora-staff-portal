import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import RichTextBlockEditor from "@/components/lms/RichTextBlockEditor";
import { normalizeKnowledgeCheckData } from "@/lib/lmsConstants";

export default function KnowledgeCheckEditor({ data, onChange }) {
  const normalized = normalizeKnowledgeCheckData(data);
  const questions = normalized.questions || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, questions.length - 1);
  const q = questions[safeIdx];

  const updateQuestion = (idx, updates) => {
    const newQuestions = [...questions];
    newQuestions[idx] = { ...newQuestions[idx], ...updates };
    onChange({ questions: newQuestions });
  };

  const addQuestion = () => {
    const newQ = { id: crypto.randomUUID(), question: "", options: ["", ""], correct_index: 0, explanation: "" };
    onChange({ questions: [...questions, newQ] });
    setActiveIdx(questions.length);
  };

  const deleteQuestion = (idx) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter((_, i) => i !== idx);
    onChange({ questions: newQuestions });
    setActiveIdx(Math.max(0, safeIdx - 1));
  };

  if (!q) return null;

  return (
    <div className="space-y-3">
      {/* Question tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {questions.map((question, idx) => (
          <button
            key={question.id || idx}
            onClick={() => setActiveIdx(idx)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              idx === safeIdx ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"
            }`}
          >
            Q{idx + 1}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={addQuestion} className="h-7">
          <Plus className="w-3 h-3 mr-1" /> Add Question
        </Button>
      </div>

      {/* Question editor */}
      <div className="space-y-2 border rounded-md p-3 bg-muted/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Question {safeIdx + 1} of {questions.length}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={questions.length <= 1} onClick={() => deleteQuestion(safeIdx)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Question</Label>
          <Input value={q.question || ""} onChange={e => updateQuestion(safeIdx, { question: e.target.value })} placeholder="e.g. What is the correct procedure for..." className="text-sm h-8" />
        </div>
        {(q.options || []).map((opt, oIdx) => (
          <div key={oIdx} className="flex items-center gap-2">
            <button onClick={() => updateQuestion(safeIdx, { correct_index: oIdx })}
              className={`w-4 h-4 rounded-full border-2 shrink-0 ${q.correct_index === oIdx ? "border-green-500 bg-green-500" : "border-slate-300"}`}
              title="Mark as correct" />
            <Input value={opt} onChange={e => {
              const options = [...(q.options || [])];
              options[oIdx] = e.target.value;
              updateQuestion(safeIdx, { options });
            }} placeholder={`Option ${oIdx + 1}`} className="text-sm h-8 flex-1" />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" disabled={(q.options || []).length <= 2}
              onClick={() => {
                const options = (q.options || []).filter((_, i) => i !== oIdx);
                const newCorrect = oIdx < q.correct_index ? q.correct_index - 1 : (oIdx === q.correct_index ? 0 : q.correct_index);
                updateQuestion(safeIdx, { options, correct_index: newCorrect });
              }}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => updateQuestion(safeIdx, { options: [...(q.options || []), ""] })}>
            <Plus className="w-3 h-3 mr-1" /> Add Option
          </Button>
          <span className="text-[10px] text-muted-foreground">Click circle to mark correct answer</span>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Explanation (shown after answering)</Label>
          <RichTextBlockEditor value={q.explanation || ""} onChange={html => updateQuestion(safeIdx, { explanation: html })} />
        </div>
      </div>

      {/* Navigation between questions */}
      {questions.length > 1 && (
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" disabled={safeIdx === 0} onClick={() => setActiveIdx(safeIdx - 1)}>
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">{safeIdx + 1} / {questions.length}</span>
          <Button size="sm" variant="ghost" disabled={safeIdx === questions.length - 1} onClick={() => setActiveIdx(safeIdx + 1)}>
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}