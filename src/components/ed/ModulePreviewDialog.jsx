import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  X, ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock,
  Target, Presentation, FileText, HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ModulePreviewDialog({ open, onClose, module }) {
  const [activeView, setActiveView] = useState("overview");
  const [slideIdx, setSlideIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});

  const slides = module?.slides || [];
  const objectives = (module?.learning_objectives || []).filter(o => o?.trim());
  const quizQuestions = module?.quiz_questions || [];
  const attachments = module?.file_attachments || [];

  const selectQuizAnswer = (qId, optIdx) => {
    if (quizSubmitted[qId]) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const submitQuiz = (qId) => {
    setQuizSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  const themeMap = {
    light: { bg: "bg-white", text: "text-slate-800", accent: "bg-indigo-600" },
    dark: { bg: "bg-slate-800", text: "text-white", accent: "bg-indigo-500" },
    brand: { bg: "bg-accent", text: "text-accent-foreground", accent: "bg-primary" },
  };

  const renderOverview = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">{module?.title || "Untitled Module"}</h2>
        {module?.description && <p className="text-sm text-muted-foreground">{module.description}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {module?.category && <Badge variant="secondary" className="text-[10px]">{module.category}</Badge>}
          {module?.difficulty && <Badge variant="outline" className="text-[10px]">{module.difficulty}</Badge>}
          {module?.duration_minutes > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> {module.duration_minutes} min</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {slides.length > 0 && (
          <button onClick={() => { setActiveView("slides"); setSlideIdx(0); }}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Presentation className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Slide Presentation</p>
              <p className="text-xs text-muted-foreground">{slides.length} slide(s)</p>
            </div>
          </button>
        )}

        {module?.content_html && (
          <button onClick={() => setActiveView("content")}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Lesson Content</p>
              <p className="text-xs text-muted-foreground">Read reference material</p>
            </div>
          </button>
        )}

        {objectives.length > 0 && (
          <button onClick={() => setActiveView("objectives")}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Learning Objectives</p>
              <p className="text-xs text-muted-foreground">{objectives.length} objective(s)</p>
            </div>
          </button>
        )}

        {quizQuestions.length > 0 && (
          <button onClick={() => setActiveView("quiz")}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Knowledge Check</p>
              <p className="text-xs text-muted-foreground">{quizQuestions.length} question(s)</p>
            </div>
          </button>
        )}
      </div>

      {attachments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attached Files</p>
          <div className="space-y-2">
            {attachments.map(att => (
              <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                {att.file_type === "video" ? <ArrowRight className="w-4 h-4 text-red-500" /> :
                 att.file_type === "slides" ? <Presentation className="w-4 h-4 text-orange-500" /> :
                 <FileText className="w-4 h-4 text-blue-500" />}
                <span className="text-sm font-medium flex-1 truncate">{att.name}</span>
                <Badge variant="outline" className="text-[10px]">{att.file_type}</Badge>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSlides = () => {
    if (slides.length === 0) return null;
    const slide = slides[slideIdx];
    const theme = themeMap[slide.theme || module?.slide_theme || "light"] || themeMap.light;
    const bullets = (slide.body || "").split("\n").filter(l => l.trim());

    return (
      <div className="space-y-3">
        <button onClick={() => setActiveView("overview")}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to overview
        </button>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Slide {slideIdx + 1} of {slides.length}
          </p>
          {slides.length > 1 && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setSlideIdx(i => Math.max(0, i - 1))} disabled={slideIdx === 0}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))} disabled={slideIdx === slides.length - 1}>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
          <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-6`}>
            {slide.title && (
              <>
                <h3 className="text-lg font-bold mb-3">{slide.title}</h3>
                <div className={`h-0.5 ${theme.accent} rounded-full mb-4 w-20`} />
              </>
            )}
            <div className="flex-1 overflow-hidden">
              {slide.layout === "full_image" && slide.image_url ? (
                <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
              ) : slide.layout === "image_right" ? (
                <div className="flex h-full gap-4">
                  <ul className="flex-1 space-y-2">
                    {bullets.map((b, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className={`${theme.accent} w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`} /> {b}
                      </li>
                    ))}
                  </ul>
                  {slide.image_url && <img src={slide.image_url} alt="" className="w-1/3 object-cover rounded" />}
                </div>
              ) : (
                <ul className="space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className={`${theme.accent} w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`} /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {slide.notes && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Speaker notes</summary>
            <p className="mt-1 p-2 bg-muted/30 rounded">{slide.notes}</p>
          </details>
        )}
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-3">
      <button onClick={() => setActiveView("overview")}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to overview
      </button>
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: module?.content_html || "" }} />
    </div>
  );

  const renderObjectives = () => (
    <div className="space-y-3">
      <button onClick={() => setActiveView("overview")}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to overview
      </button>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" /> Learning Objectives
      </p>
      <ul className="space-y-2">
        {objectives.map((obj, i) => (
          <li key={i} className="text-sm flex items-start gap-2 p-2 rounded-md bg-muted/20">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderQuiz = () => (
    <div className="space-y-3">
      <button onClick={() => setActiveView("overview")}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to overview
      </button>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5" /> Knowledge Check
      </p>
      {quizQuestions.map((q, qIdx) => {
        const selected = quizAnswers[q.id];
        const submitted = quizSubmitted[q.id];
        const isCorrect = selected === q.correct_index;
        return (
          <div key={q.id} className="p-4 rounded-lg border bg-card">
            <p className="text-sm font-medium mb-3">{qIdx + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {(q.options || []).map((opt, oIdx) => {
                const isSelected = selected === oIdx;
                const showCorrect = submitted && oIdx === q.correct_index;
                const showWrong = submitted && isSelected && oIdx !== q.correct_index;
                return (
                  <button key={oIdx} onClick={() => selectQuizAnswer(q.id, oIdx)} disabled={submitted}
                    className={`flex items-center gap-2 w-full text-left p-2.5 rounded-md border text-sm transition-colors ${
                      showCorrect ? "border-green-500 bg-green-50 text-green-800" :
                      showWrong ? "border-red-500 bg-red-50 text-red-800" :
                      isSelected ? "border-primary bg-primary/5" :
                      "border-input hover:bg-muted/30"
                    } ${submitted ? "cursor-default" : "cursor-pointer"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      showCorrect ? "border-green-500 bg-green-500" :
                      showWrong ? "border-red-500 bg-red-500" :
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`} />
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {submitted ? (
              <div className={`mt-3 p-2.5 rounded-md text-xs ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <p className="font-medium mb-0.5">{isCorrect ? "✅ Correct!" : "❌ Not quite right."}</p>
                {q.explanation && <p className="text-muted-foreground">{q.explanation}</p>}
              </div>
            ) : (
              <Button size="sm" className="mt-3" disabled={selected === undefined} onClick={() => submitQuiz(q.id)}>
                Submit Answer
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">Preview Mode</Badge>
          </DialogTitle>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">
          {activeView === "overview" && renderOverview()}
          {activeView === "slides" && renderSlides()}
          {activeView === "content" && renderContent()}
          {activeView === "objectives" && renderObjectives()}
          {activeView === "quiz" && renderQuiz()}
        </div>
      </DialogContent>
    </Dialog>
  );
}