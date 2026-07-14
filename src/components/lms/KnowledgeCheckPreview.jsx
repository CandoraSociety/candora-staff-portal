import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, CheckCircle2, RotateCcw, Eye } from "lucide-react";
import { normalizeKnowledgeCheckData } from "@/lib/lmsConstants";

export default function KnowledgeCheckPreview({ block, quizAnswers, quizSubmitted, selectQuizAnswer, submitQuiz, resetQuiz }) {
  const data = normalizeKnowledgeCheckData(block.data || {});
  const questions = data.questions || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [revealedQs, setRevealedQs] = useState({});

  if (questions.length === 0) return null;

  const answers = quizAnswers[block.id] || {};
  const submitted = quizSubmitted[block.id] || {};
  const allAnswered = questions.every((_, qIdx) => submitted[qIdx]);
  const correctCount = questions.filter((q, qIdx) => answers[qIdx] === (q.correct_index || 0)).length;

  const q = questions[currentQ];
  const selected = answers[currentQ];
  const isSubmitted = submitted[currentQ];
  const correctIdx = q.correct_index || 0;
  const isCorrect = selected === correctIdx;
  const isRevealed = isCorrect || revealedQs[currentQ];

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Knowledge Check
        </p>
        <span className="text-xs text-muted-foreground font-medium">
          Question {currentQ + 1} of {questions.length}
        </span>
      </div>

      {/* Progress dots */}
      {questions.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3">
          {questions.map((qItem, qIdx) => {
            const isAnswered = submitted[qIdx];
            const isCorrectQ = isAnswered && answers[qIdx] === (qItem.correct_index || 0);
            const isCurrent = qIdx === currentQ;
            return (
              <button
                key={qIdx}
                onClick={() => setCurrentQ(qIdx)}
                className={`h-2 rounded-full transition-all ${
                  isCurrent ? "w-6 bg-primary" :
                  isCorrectQ ? "w-2 bg-green-500" :
                  isAnswered ? "w-2 bg-red-400" :
                  "w-2 bg-muted-foreground/30"
                }`}
                title={`Question ${qIdx + 1}`}
              />
            );
          })}
        </div>
      )}

      <p className="text-sm font-medium mb-3">{q.question || "Question"}</p>
      <div className="space-y-1.5">
        {(q.options || []).map((opt, idx) => {
          const isSelected = selected === idx;
          const showCorrect = isSubmitted && isRevealed && idx === correctIdx;
          const showWrong = isSubmitted && isSelected && idx !== correctIdx;
          return (
            <button
              key={idx}
              onClick={() => selectQuizAnswer(block.id, currentQ, idx)}
              disabled={isSubmitted}
              className={`flex items-center gap-2 w-full text-left p-2.5 rounded-md border text-sm transition-colors ${
                showCorrect ? "border-green-500 bg-green-50 text-green-800" :
                showWrong ? "border-red-500 bg-red-50 text-red-800" :
                isSelected ? "border-primary bg-primary/5" :
                "border-input hover:bg-muted/30"
              } ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                showCorrect ? "border-green-500 bg-green-500" :
                showWrong ? "border-red-500 bg-red-500" :
                isSelected ? "border-primary bg-primary" : "border-muted-foreground"
              }`} />
              <span>{opt || `Option ${idx + 1}`}</span>
            </button>
          );
        })}
      </div>

      {isSubmitted ? (
        <div className="mt-3 space-y-2">
          {isCorrect ? (
            <div className="p-2.5 rounded-md text-xs bg-green-50 text-green-800">
              <p className="font-medium mb-0.5">✅ Correct!</p>
              {q.explanation && (
                <div className="ql-snow">
                  <div className="ql-editor px-0 py-0 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                </div>
              )}
            </div>
          ) : isRevealed ? (
            <div className="p-2.5 rounded-md text-xs bg-red-50 text-red-800">
              <p className="font-medium mb-0.5">❌ Not quite right.</p>
              {q.explanation && (
                <div className="ql-snow">
                  <div className="ql-editor px-0 py-0 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-md text-xs bg-red-50 text-red-800">
              <p className="font-medium mb-0.5">❌ Not quite right. Give it another try!</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => resetQuiz(block.id, currentQ)}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Try Again
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRevealedQs(prev => ({ ...prev, [currentQ]: true }))}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Show Answer
                </Button>
              </div>
            </div>
          )}
          {isRevealed && (currentQ < questions.length - 1 ? (
            <Button size="sm" onClick={() => setCurrentQ(currentQ + 1)}>
              Next Question <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : allAnswered ? (
            <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20 text-sm">
              <p className="font-medium flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4" /> Quiz Complete!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You scored {correctCount} out of {questions.length} ({Math.round((correctCount / questions.length) * 100)}%)
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-600">Some questions haven't been answered yet. Tap a dot above to jump to them.</p>
          ))}
        </div>
      ) : (
        <Button size="sm" className="mt-3" disabled={selected === undefined} onClick={() => submitQuiz(block.id, currentQ)}>
          Submit Answer
        </Button>
      )}
    </div>
  );
}