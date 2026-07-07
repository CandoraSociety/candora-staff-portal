import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, X,
  ChevronDown, ChevronRight, Clock, BarChart2, Target, Lightbulb,
  FileText, Image as ImageIcon, Video, File, Link2, MessageSquare,
  CheckSquare, HelpCircle, Table as TableIcon, Presentation,
  Lock, Menu, BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  MODULE_CATEGORIES, DIFFICULTY_LEVELS, MODULE_STATUSES,
  getModuleCategory, getDifficulty, getModuleStatus,
} from "@/lib/lmsConstants";

export default function ModulePreview({ module, onExit }) {
  // Flatten all chapters/sections/blocks into a sequential flow
  const allSections = [];
  (module.chapters || []).forEach((ch, chIdx) => {
    (ch.sections || []).forEach((sec, secIdx) => {
      allSections.push({ chapter: ch, section: sec, chIdx, secIdx });
    });
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState(() => {
    // Expand the chapter containing the current section by default
    const chIdx = allSections[0]?.chIdx ?? 0;
    return { [chIdx]: true };
  });

  const totalSections = allSections.length;
  const completedCount = completedSections.size;
  const progressPercent = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  const current = allSections[currentIdx];
  const hasNext = currentIdx < totalSections - 1;
  const hasPrev = currentIdx > 0;

  // Furthest unlocked section: current in-progress + everything completed before it
  const maxUnlocked = Math.max(currentIdx, ...completedSections);
  const isUnlocked = (idx) => idx <= maxUnlocked;

  const markComplete = () => {
    setCompletedSections(prev => new Set([...prev, currentIdx]));
    if (hasNext) setCurrentIdx(currentIdx + 1);
  };

  const goTo = (idx) => {
    if (idx >= 0 && idx < totalSections && isUnlocked(idx)) {
      setCurrentIdx(idx);
      setSidebarOpen(false);
    }
  };

  const toggleChapter = (chIdx) => {
    setExpandedChapters(prev => ({ ...prev, [chIdx]: !prev[chIdx] }));
  };

  const toggleAccordion = (id) => {
    setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheckItem = (blockId, itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${blockId}-${itemId}`]: !prev[`${blockId}-${itemId}`],
    }));
  };

  const submitQuiz = (blockId) => {
    setQuizSubmitted(prev => ({ ...prev, [blockId]: true }));
  };

  const selectQuizAnswer = (blockId, optIdx) => {
    if (quizSubmitted[blockId]) return;
    setQuizAnswers(prev => ({ ...prev, [blockId]: optIdx }));
  };

  const cat = getModuleCategory(module.category);
  const diff = getDifficulty(module.difficulty);
  const status = getModuleStatus(module.status);

  if (totalSections === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">This module has no content sections yet. Add chapters and sections in the editor to see a preview.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onExit}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Editor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Preview top bar */}
      <div className="shrink-0 bg-background border-b px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="w-4 h-4 mr-1" /> Exit Preview
          </Button>
          <Badge variant="secondary" className="text-[10px]">
            <Lightbulb className="w-3 h-3 mr-1" /> Preview Mode
          </Badge>
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{module.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Section {currentIdx + 1} of {totalSections}</span>
          <div className="w-24 hidden md:block">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
          <span className="hidden md:inline">{progressPercent}%</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Left navigation sidebar */}
        <aside className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
          w-72 shrink-0 bg-background border-r overflow-y-auto
          transition-transform duration-200
        `}>
          <div className="p-3 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold truncate">{module.title}</span>
              <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
              <span className="text-[10px] font-medium text-muted-foreground shrink-0">{progressPercent}%</span>
            </div>
          </div>

          <nav className="p-2 space-y-1">
            {(module.chapters || []).map((chapter, chIdx) => {
              const chapterSections = allSections
                .map((s, i) => ({ ...s, globalIdx: i }))
                .filter(s => s.chIdx === chIdx);
              if (chapterSections.length === 0) return null;
              const chapterCompleted = chapterSections.filter(s => completedSections.has(s.globalIdx)).length;
              const isExpanded = expandedChapters[chIdx];
              const hasCurrent = chapterSections.some(s => s.globalIdx === currentIdx);

              return (
                <div key={chapter.id || chIdx}>
                  <button
                    onClick={() => toggleChapter(chIdx)}
                    className={`flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md text-xs font-semibold hover:bg-muted/50 transition-colors ${hasCurrent ? "text-primary" : "text-foreground"}`}
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate flex-1">{chapter.title || `Chapter ${chIdx + 1}`}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{chapterCompleted}/{chapterSections.length}</span>
                  </button>

                  {isExpanded && (
                    <ul className="ml-3 border-l pl-1.5 space-y-0.5 mt-0.5">
                      {chapterSections.map(({ section, globalIdx, secIdx }) => {
                        const completed = completedSections.has(globalIdx);
                        const isCurrent = globalIdx === currentIdx;
                        const unlocked = isUnlocked(globalIdx);

                        return (
                          <li key={section.id || globalIdx}>
                            <button
                              onClick={() => goTo(globalIdx)}
                              disabled={!unlocked}
                              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                                isCurrent ? "bg-primary/10 text-primary font-medium" :
                                completed ? "text-green-700 hover:bg-green-50" :
                                unlocked ? "text-foreground hover:bg-muted/50" :
                                "text-muted-foreground/50 cursor-not-allowed"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              ) : isCurrent ? (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
                              ) : unlocked ? (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                              )}
                              <span className="truncate">{section.title || `Section ${secIdx + 1}`}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Module header (only on first section) */}
            {currentIdx === 0 && (
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${diff.color}`}>{diff.label}</Badge>
                  {module.duration_minutes > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Clock className="w-3 h-3" /> {module.duration_minutes} min
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-1">{module.title}</h1>
                {module.description && (
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                )}
                {(module.learning_objectives || []).filter(o => o.trim()).length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-card border">
                    <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-primary" /> Learning Objectives
                    </p>
                    <ul className="space-y-1">
                      {module.learning_objectives.filter(o => o.trim()).map((obj, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <span className="font-medium">{current.chapter.title || `Chapter ${current.chIdx + 1}`}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{current.section.title || `Section ${current.secIdx + 1}`}</span>
            </div>

            {/* Content blocks */}
            <div className="space-y-5">
              {(current.section.content_blocks || []).map(block => (
                <PreviewBlock
                  key={block.id}
                  block={block}
                  expandedAccordions={expandedAccordions}
                  toggleAccordion={toggleAccordion}
                  checkedItems={checkedItems}
                  toggleCheckItem={toggleCheckItem}
                  quizAnswers={quizAnswers}
                  quizSubmitted={quizSubmitted}
                  selectQuizAnswer={selectQuizAnswer}
                  submitQuiz={submitQuiz}
                />
              ))}
            </div>

            {/* Navigation footer */}
            <div className="mt-8 pt-6 border-t flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => goTo(currentIdx - 1)} disabled={!hasPrev || !isUnlocked(currentIdx - 1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              {completedSections.has(currentIdx) ? (
                <Button size="sm" onClick={() => hasNext && goTo(currentIdx + 1)} disabled={!hasNext}>
                  {hasNext ? "Next" : "Complete"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={markComplete}>
                  {hasNext ? "Complete & Continue" : "Mark Complete"} <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>

            {completedSections.has(currentIdx) && (
              <p className="text-center text-xs text-green-600 mt-3 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Section completed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ block, expandedAccordions, toggleAccordion, checkedItems, toggleCheckItem, quizAnswers, quizSubmitted, selectQuizAnswer, submitQuiz }) {
  const data = block.data || {};
  const BLOCK_ICONS = {
    rich_text: FileText, image: ImageIcon, video: Video, pdf: File,
    external_link: Link2, callout: MessageSquare, checklist: CheckSquare,
    knowledge_check: HelpCircle, accordion: ChevronDown, table: TableIcon, slides: Presentation,
  };
  const Icon = BLOCK_ICONS[block.type] || FileText;

  switch (block.type) {
    case "rich_text":
      return (
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: data.html || "" }} />
        </div>
      );

    case "image":
      return (
        <figure className="space-y-2">
          {data.url ? (
            <img src={data.url} alt={data.alt_text || ""} className="rounded-lg border w-full max-h-96 object-contain" />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" /> No image set
            </div>
          )}
          {data.caption && <figcaption className="text-xs text-muted-foreground text-center">{data.caption}</figcaption>}
        </figure>
      );

    case "video":
      return (
        <div className="space-y-2">
          {data.title && <p className="text-sm font-medium">{data.title}</p>}
          {data.url ? (
            data.url.includes("youtube") ? (
              <div className="aspect-video rounded-lg overflow-hidden border">
                <iframe src={data.url.replace("watch?v=", "embed/")} className="w-full h-full" title={data.title || "Video"} allowFullScreen />
              </div>
            ) : data.url.includes("vimeo") ? (
              <div className="aspect-video rounded-lg overflow-hidden border">
                <iframe src={data.url.replace("vimeo.com/", "player.vimeo.com/video/")} className="w-full h-full" title={data.title || "Video"} allowFullScreen />
              </div>
            ) : (
              <video src={data.url} controls className="w-full rounded-lg border" />
            )
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
              <Video className="w-6 h-6 mx-auto mb-1 opacity-40" /> No video set
            </div>
          )}
        </div>
      );

    case "pdf":
      return (
        <div className="space-y-2">
          {data.title && <p className="text-sm font-medium flex items-center gap-1.5"><File className="w-3.5 h-3.5" /> {data.title}</p>}
          {data.url ? (
            <iframe src={data.url} className="w-full h-96 rounded-lg border" title={data.title || "PDF"} />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
              <File className="w-6 h-6 mx-auto mb-1 opacity-40" /> No PDF set
            </div>
          )}
        </div>
      );

    case "external_link":
      return (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">{data.label || data.url || "External Link"}</p>
              {data.description && <p className="text-xs text-muted-foreground mt-0.5">{data.description}</p>}
            </div>
          </div>
        </a>
      );

    case "callout":
      const variants = {
        info: "bg-blue-50 border-blue-300 text-blue-900",
        warning: "bg-amber-50 border-amber-300 text-amber-900",
        tip: "bg-green-50 border-green-300 text-green-900",
        success: "bg-emerald-50 border-emerald-300 text-emerald-900",
      };
      const icons = { info: "ℹ️", warning: "⚠️", tip: "💡", success: "✅" };
      const variant = data.variant || "info";
      return (
        <div className={`rounded-lg border p-4 ${variants[variant] || variants.info}`}>
          {data.title && <p className="font-semibold text-sm mb-1 flex items-center gap-1.5">{icons[variant]} {data.title}</p>}
          {data.content && <p className="text-sm">{data.content}</p>}
        </div>
      );

    case "checklist":
      const items = data.items || [];
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Checklist
          </p>
          {items.map(item => {
            const checked = checkedItems[`${block.id}-${item.id}`];
            return (
              <button
                key={item.id}
                onClick={() => toggleCheckItem(block.id, item.id)}
                className="flex items-center gap-2.5 w-full text-left p-2 rounded-md hover:bg-muted/30 transition-colors"
              >
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{item.text || "Untitled item"}</span>
              </button>
            );
          })}
        </div>
      );

    case "knowledge_check":
      const selected = quizAnswers[block.id];
      const submitted = quizSubmitted[block.id];
      const correctIdx = data.correct_index || 0;
      const isCorrect = selected === correctIdx;
      return (
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Knowledge Check
          </p>
          <p className="text-sm font-medium mb-3">{data.question || "Question"}</p>
          <div className="space-y-1.5">
            {(data.options || []).map((opt, idx) => {
              const isSelected = selected === idx;
              const showCorrect = submitted && idx === correctIdx;
              const showWrong = submitted && isSelected && idx !== correctIdx;
              return (
                <button
                  key={idx}
                  onClick={() => selectQuizAnswer(block.id, idx)}
                  disabled={submitted}
                  className={`flex items-center gap-2 w-full text-left p-2.5 rounded-md border text-sm transition-colors ${
                    showCorrect ? "border-green-500 bg-green-50 text-green-800" :
                    showWrong ? "border-red-500 bg-red-50 text-red-800" :
                    isSelected ? "border-primary bg-primary/5" :
                    "border-input hover:bg-muted/30"
                  } ${submitted ? "cursor-default" : "cursor-pointer"}`}
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
          {submitted ? (
            <div className={`mt-3 p-2.5 rounded-md text-xs ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <p className="font-medium mb-0.5">{isCorrect ? "✅ Correct!" : "❌ Not quite right."}</p>
              {data.explanation && <p className="text-muted-foreground">{data.explanation}</p>}
            </div>
          ) : (
            <Button size="sm" className="mt-3" disabled={selected === undefined} onClick={() => submitQuiz(block.id)}>
              Submit Answer
            </Button>
          )}
        </div>
      );

    case "accordion":
      const accItems = data.items || [];
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" /> Expandable Sections
          </p>
          {accItems.map(item => {
            const isOpen = expandedAccordions[`${block.id}-${item.id}`];
            return (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion(`${block.id}-${item.id}`)}
                  className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium">{item.title || "Untitled section"}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isOpen && item.content && (
                  <div className="px-3 pb-3 text-sm text-muted-foreground border-t pt-2">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            {(data.headers || []).length > 0 && (
              <thead className="bg-muted/50 border-b">
                <tr>{(data.headers || []).map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium text-xs">{h}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {(data.rows || []).map((row, rIdx) => (
                <tr key={rIdx} className="border-b last:border-0">
                  {(data.headers || []).map((_, cIdx) => <td key={cIdx} className="px-3 py-2">{row[cIdx]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "slides":
      return <SlidePreviewPlayer data={data} />;

    default:
      return (
        <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground">
          <Icon className="w-4 h-4 inline mr-1" /> Unsupported block type: {block.type}
        </div>
      );
  }
}

function SlidePreviewPlayer({ data }) {
  const slides = data.slides || [];
  const [idx, setIdx] = useState(0);
  if (slides.length === 0) return null;

  const themeMap = {
    light: { bg: "bg-white", text: "text-slate-800", accent: "bg-indigo-600" },
    dark: { bg: "bg-slate-800", text: "text-white", accent: "bg-indigo-500" },
    brand: { bg: "bg-accent", text: "text-accent-foreground", accent: "bg-primary" },
  };
  const theme = themeMap[data.theme || "light"] || themeMap.light;
  const slide = slides[idx];
  const bullets = (slide.body || "").split("\n").filter(l => l.trim());

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Presentation className="w-3.5 h-3.5" /> Slide Deck ({slides.length} slides)
      </p>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
        <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-4`}>
          {slide.title && (
            <>
              <h3 className="text-sm font-bold mb-2">{slide.title}</h3>
              <div className={`h-0.5 ${theme.accent} rounded-full mb-3 w-16`} />
            </>
          )}
          <div className="flex-1 overflow-hidden">
            {slide.layout === "full_image" && slide.image_url ? (
              <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
            ) : slide.layout === "image_right" ? (
              <div className="flex h-full">
                <ul className="flex-1 space-y-1.5">
                  {bullets.map((b, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className={`${theme.accent} w-1 h-1 rounded-full mt-1 shrink-0`} /> {b}
                    </li>
                  ))}
                </ul>
                {slide.image_url && <img src={slide.image_url} alt="" className="w-1/3 object-cover rounded ml-3" />}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span className={`${theme.accent} w-1 h-1 rounded-full mt-1 shrink-0`} /> {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
              className="text-white disabled:opacity-30 px-1">‹</button>
            <span className="text-[10px] text-white font-medium">{idx + 1} / {slides.length}</span>
            <button onClick={() => setIdx(i => Math.min(slides.length - 1, i + 1))} disabled={idx === slides.length - 1}
              className="text-white disabled:opacity-30 px-1">›</button>
          </div>
        )}
      </div>
      {slide.notes && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Speaker notes</summary>
          <p className="mt-1 p-2 bg-muted/30 rounded">{slide.notes}</p>
        </details>
      )}
    </div>
  );
}