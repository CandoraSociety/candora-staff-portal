import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, X,
  ChevronDown, ChevronRight, Clock, BarChart2, Target, Lightbulb,
  FileText, Image as ImageIcon, Video, File, Link2, MessageSquare,
  CheckSquare, HelpCircle, Table as TableIcon, Presentation, Sparkles,
  Lock, Menu, BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import "react-quill/dist/quill.snow.css";
import {
  MODULE_CATEGORIES, DIFFICULTY_LEVELS, MODULE_STATUSES,
  getModuleCategory, getDifficulty, getModuleStatus,
} from "@/lib/lmsConstants";
import DynamicBlockPreview from "@/components/lms/DynamicBlockPreview";
import KnowledgeCheckPreview from "@/components/lms/KnowledgeCheckPreview";
import { normalizeKnowledgeCheckData, getSectionPages } from "@/lib/lmsConstants";

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
  const [showIntro, setShowIntro] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [furthestReached, setFurthestReached] = useState(0);
  const [currentPageInSection, setCurrentPageInSection] = useState(0);
  const [dynamicRevealCounts, setDynamicRevealCounts] = useState({});
  const [expandedChapters, setExpandedChapters] = useState(() => {
    const chIdx = allSections[0]?.chIdx ?? 0;
    return { [chIdx]: true };
  });

  const totalSections = allSections.length;
  const completedCount = completedSections.size;
  const progressPercent = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  const current = allSections[currentIdx];
  const hasNext = currentIdx < totalSections - 1;
  const hasPrev = currentIdx > 0;

  const isFlexible = (module.navigation_mode || "linear_review") === "flexible";

  // Check for incomplete interactive blocks — learners must finish all before completing.
  // In flexible mode, no gating is enforced.
  const checkBlockIncomplete = (block) => {
    if (block.type === "accordion") {
      const items = block.data?.items || [];
      return items.some(item => !expandedAccordions[`${block.id}-${item.id}`]);
    }
    if (block.type === "dynamic") {
      const elements = block.data?.elements || [];
      if (elements.length === 0) return false;
      return (dynamicRevealCounts[block.id] || 0) < elements.length;
    }
    if (block.type === "knowledge_check") {
      const kcData = normalizeKnowledgeCheckData(block.data);
      const questions = kcData.questions || [];
      if (questions.length === 0) return false;
      const submitted = quizSubmitted[block.id] || {};
      return questions.some((_, qIdx) => !submitted[qIdx]);
    }
    if (block.type === "checklist") {
      const items = block.data?.items || [];
      if (items.length === 0) return false;
      return items.some(item => !checkedItems[`${block.id}-${item.id}`]);
    }
    return false;
  };

  const sectionBlocks = current?.section?.content_blocks || [];
  const sectionPages = getSectionPages(sectionBlocks);
  const safePageIdx = Math.min(currentPageInSection, Math.max(0, sectionPages.length - 1));
  const currentPageBlocks = sectionPages[safePageIdx] || [];
  const isLastPage = safePageIdx >= sectionPages.length - 1;

  const hasIncompleteOnPage = !isFlexible && currentPageBlocks.some(checkBlockIncomplete);
  const hasIncompleteBlocks = !isFlexible && sectionBlocks.some(checkBlockIncomplete);

  // Furthest unlocked section: tracks the furthest section ever reached, so navigating
  // back doesn't re-lock sections that were already in progress.
  // In flexible mode, all sections are unlocked.
  const maxUnlocked = isFlexible ? totalSections - 1 : Math.max(furthestReached, ...completedSections);
  const isUnlocked = (idx) => isFlexible || idx <= maxUnlocked;

  const markComplete = () => {
    setCompletedSections(prev => new Set([...prev, currentIdx]));
    if (hasNext) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      setCurrentPageInSection(0);
      setFurthestReached(prev => Math.max(prev, next));
    }
  };

  const goTo = (idx) => {
    if (idx >= 0 && idx < totalSections && isUnlocked(idx)) {
      setCurrentIdx(idx);
      setCurrentPageInSection(0);
      setSidebarOpen(false);
    }
  };

  const revealDynamicNext = (blockId) => {
    setDynamicRevealCounts(prev => ({ ...prev, [blockId]: (prev[blockId] || 0) + 1 }));
  };

  const toggleChapter = (chIdx) => {
    setExpandedChapters(prev => ({ ...prev, [chIdx]: !prev[chIdx] }));
  };

  const beginTraining = () => {
    setShowIntro(false);
    setCurrentIdx(0);
    setCurrentPageInSection(0);
    setFurthestReached(0);
  };

  const goToOverview = () => {
    setShowIntro(true);
    setSidebarOpen(false);
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

  const submitQuiz = (blockId, qIdx) => {
    setQuizSubmitted(prev => ({ ...prev, [blockId]: { ...(prev[blockId] || {}), [qIdx]: true } }));
  };

  const resetQuiz = (blockId, qIdx) => {
    setQuizSubmitted(prev => {
      const blockSubs = { ...(prev[blockId] || {}) };
      delete blockSubs[qIdx];
      return { ...prev, [blockId]: blockSubs };
    });
    setQuizAnswers(prev => {
      const blockAnswers = { ...(prev[blockId] || {}) };
      delete blockAnswers[qIdx];
      return { ...prev, [blockId]: blockAnswers };
    });
  };

  const selectQuizAnswer = (blockId, qIdx, optIdx) => {
    const blockSubmitted = quizSubmitted[blockId] || {};
    if (blockSubmitted[qIdx]) return;
    setQuizAnswers(prev => ({ ...prev, [blockId]: { ...(prev[blockId] || {}), [qIdx]: optIdx } }));
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Preview top bar — Candora branded */}
      <div className="shrink-0 bg-accent text-accent-foreground border-b border-accent/40 px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="lg:hidden text-accent-foreground hover:bg-accent-foreground/10" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-accent-foreground hover:bg-accent-foreground/10" onClick={onExit}>
            <X className="w-4 h-4 mr-1" /> Exit Preview
          </Button>
          <Badge className="text-[10px] bg-primary text-primary-foreground border-0">
            <Lightbulb className="w-3 h-3 mr-1" /> Preview Mode
          </Badge>
          <span className="text-sm font-display font-semibold text-accent-foreground/80 hidden sm:inline">{module.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-accent-foreground/70">
          {!showIntro && <span className="hidden sm:inline">Section {currentIdx + 1} of {totalSections}</span>}
          <div className="w-24 hidden md:block">
            <Progress value={progressPercent} className="h-1.5 bg-accent-foreground/20" />
          </div>
          <span className="hidden md:inline font-medium">{progressPercent}%</span>
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
            <button
              onClick={goToOverview}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${showIntro ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"}`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Module Overview</span>
            </button>
            <div className="h-px bg-border my-1" />

            {(module.chapters || []).map((chapter, chIdx) => {
              const chapterSections = allSections
                .map((s, i) => ({ ...s, globalIdx: i }))
                .filter(s => s.chIdx === chIdx);
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
                      {chapterSections.length === 0 ? (
                        <li className="px-2 py-1.5 text-xs text-muted-foreground/50 italic">No sections yet</li>
                      ) : chapterSections.map(({ section, globalIdx, secIdx }) => {
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
          {showIntro ? (
            <div className="h-full flex items-center justify-center px-6 py-10">
              <div className="w-full max-w-3xl">
                {/* Branded hero header */}
                <div className="rounded-2xl overflow-hidden shadow-xl mb-6 bg-accent">
                  <div className="px-8 py-6 bg-gradient-to-br from-accent to-accent/80 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-2 mb-3 relative">
                      <Badge className="text-[10px] bg-primary text-primary-foreground border-0">{cat.label}</Badge>
                      <Badge className="text-[10px] bg-accent-foreground/15 text-accent-foreground border-0">{diff.label}</Badge>
                      {module.duration_minutes > 0 && (
                        <Badge className="text-[10px] bg-accent-foreground/15 text-accent-foreground border-0 gap-1">
                          <Clock className="w-3 h-3" /> {module.duration_minutes} min
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-accent-foreground mb-2 relative">{module.title}</h1>
                    {module.description && (
                      <p className="text-sm text-accent-foreground/70 leading-relaxed max-w-2xl relative">{module.description}</p>
                    )}
                  </div>
                </div>

                {/* Learning objectives card */}
                {(module.learning_objectives || []).filter(o => o.trim()).length > 0 && (
                  <div className="p-6 rounded-2xl bg-white border border-amber-100 shadow-sm">
                    <p className="text-sm font-display font-semibold flex items-center gap-2 mb-4 text-accent">
                      <Target className="w-4 h-4 text-primary" /> Learning Objectives
                    </p>
                    <ul className="space-y-3">
                      {module.learning_objectives.filter(o => o.trim()).map((obj, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                          </div>
                          <span className="leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-8 flex flex-col items-center gap-3">
                  <Button size="lg" onClick={beginTraining} className="px-10 py-6 text-base font-display font-semibold bg-primary hover:bg-primary/90 shadow-lg">
                    Begin Training <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground">{totalSections} section{totalSections !== 1 ? "s" : ""} across {(module.chapters || []).length} chapter{(module.chapters || []).length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-full flex flex-col">
            <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <span className="font-display font-semibold text-accent">{current.chapter.title || `Chapter ${current.chIdx + 1}`}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-medium">{current.section.title || `Section ${current.secIdx + 1}`}</span>
              </div>

              {/* Section title bar */}
              <div className="mb-6 pb-4 border-b-2 border-primary/20">
                <h2 className="text-2xl font-heading font-bold text-foreground">{current.section.title || `Section ${current.secIdx + 1}`}</h2>
              </div>

              {/* Page indicator */}
              {sectionPages.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {sectionPages.map((_, pIdx) => (
                    <div key={pIdx} className={`h-1.5 rounded-full transition-all ${pIdx === safePageIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
                  ))}
                  <span className="text-xs font-medium text-muted-foreground ml-1">Page {safePageIdx + 1} of {sectionPages.length}</span>
                </div>
              )}

              {/* Content blocks (current page only) */}
              <div className="space-y-5">
                {currentPageBlocks.map(block => (
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
                    resetQuiz={resetQuiz}
                    dynamicRevealCount={dynamicRevealCounts[block.id] || 0}
                    onDynamicRevealNext={() => revealDynamicNext(block.id)}
                  />
                ))}
              </div>

              {/* Navigation footer */}
              <div className="mt-auto pt-8">
                <div className="mt-6 pt-6 border-t-2 border-primary/20 flex items-center justify-between">
                  {safePageIdx > 0 ? (
                    <Button variant="outline" size="default" onClick={() => setCurrentPageInSection(safePageIdx - 1)} className="border-accent/30 text-accent hover:bg-accent/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous Page
                    </Button>
                  ) : currentIdx === 0 ? (
                    <Button variant="outline" size="default" onClick={goToOverview} className="border-accent/30 text-accent hover:bg-accent/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Overview
                    </Button>
                  ) : (
                    <Button variant="outline" size="default" onClick={() => goTo(currentIdx - 1)} disabled={!isUnlocked(currentIdx - 1)} className="border-accent/30 text-accent hover:bg-accent/5">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
                    </Button>
                  )}
                  {!isLastPage ? (
                    <Button size="default" onClick={() => setCurrentPageInSection(safePageIdx + 1)} disabled={hasIncompleteOnPage} className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold">
                      Next Page <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : completedSections.has(currentIdx) ? (
                    <Button size="default" onClick={() => hasNext && goTo(currentIdx + 1)} disabled={!hasNext} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display font-semibold">
                      {hasNext ? "Next" : "Complete"} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button size="default" onClick={markComplete} disabled={hasIncompleteBlocks} className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold">
                      {hasNext ? "Complete & Continue" : "Mark Complete"} <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    </Button>
                  )}
                </div>

                {!isLastPage && hasIncompleteOnPage ? (
                  <p className="text-center text-xs text-amber-600 mt-3 flex items-center justify-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5" /> Complete all interactive content on this page to continue
                  </p>
                ) : isLastPage && hasIncompleteBlocks ? (
                  <p className="text-center text-xs text-amber-600 mt-3 flex items-center justify-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5" /> Complete all interactive content to continue
                  </p>
                ) : isLastPage && completedSections.has(currentIdx) && (
                  <p className="text-center text-xs text-green-600 mt-3 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Section completed
                  </p>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ block, expandedAccordions, toggleAccordion, checkedItems, toggleCheckItem, quizAnswers, quizSubmitted, selectQuizAnswer, submitQuiz, resetQuiz, dynamicRevealCount, onDynamicRevealNext }) {
  const data = block.data || {};
  const BLOCK_ICONS = {
    rich_text: FileText, image: ImageIcon, video: Video, pdf: File,
    external_link: Link2, callout: MessageSquare, checklist: CheckSquare,
    knowledge_check: HelpCircle, accordion: ChevronDown, table: TableIcon, slides: Presentation, dynamic: Sparkles,
  };
  const Icon = BLOCK_ICONS[block.type] || FileText;

  switch (block.type) {
    case "rich_text":
      return (
        <div className="ql-snow">
          <div className="ql-editor px-0 max-w-none" dangerouslySetInnerHTML={{ __html: data.html || "" }} />
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
          {data.content && (
            <div className="ql-snow">
              <div className="ql-editor px-0 py-0 text-sm" dangerouslySetInnerHTML={{ __html: data.content }} />
            </div>
          )}
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
      return (
        <KnowledgeCheckPreview
          block={block}
          quizAnswers={quizAnswers}
          quizSubmitted={quizSubmitted}
          selectQuizAnswer={selectQuizAnswer}
          submitQuiz={submitQuiz}
          resetQuiz={resetQuiz}
        />
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
                  <div className="px-3 pb-3 border-t pt-2">
                    <div className="ql-snow">
                      <div className="ql-editor px-0 py-0 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
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

    case "dynamic":
      return <DynamicBlockPreview data={data} revealedCount={dynamicRevealCount} onRevealNext={onDynamicRevealNext} />;

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