import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks, RotateCcw, Video } from 'lucide-react';
import ModuleRecapVideo from '@/components/training/ModuleRecapVideo';
import ModuleQuiz from '@/components/training/ModuleQuiz';
import { getModuleRecap } from '@/lib/training/moduleRecaps';

// The module's closing section — the "What we've learned" recap and its quiz.
// It is not a separate window: the guided tour renders it inside its own card
// as the module's final part, after the last slide.
export default function ModuleWrapUp({ module, progress, updateProgress, onFinish, onBack }) {
  const recap = getModuleRecap(module?.key);
  const quiz = recap?.quiz || [];
  const [stage, setStage] = useState('recap');
  const [result, setResult] = useState(null);

  if (!module || !recap) return null;

  const finishRecap = async () => {
    if (!progress?.recap_done) await updateProgress({ recap_done: true });
    setStage(quiz.length ? 'quiz' : 'done');
  };

  const finishQuiz = async ({ score, passed }) => {
    setResult({ score, passed });
    await updateProgress({
      recap_done: true,
      quiz_score: score,
      quiz_passed: passed,
      quiz_done_date: new Date().toISOString(),
    });
    setStage('done');
  };

  const quizScore = result?.score ?? progress?.quiz_score;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 shrink-0 text-sidebar-primary" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-sidebar-primary">
          {stage === 'recap' ? 'Recap' : stage === 'quiz' ? 'Quiz' : 'Complete'}
          {quiz.length ? ` · ${quiz.length} questions` : ''}
        </p>
      </div>

      {stage === 'recap' && <ModuleRecapVideo key={module.key} recap={recap} moduleKey={module.key} />}

      {stage === 'quiz' && <ModuleQuiz quiz={quiz} onComplete={finishQuiz} />}

      {stage === 'done' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground">Recap complete</p>
              <p className="text-[11px] leading-snug text-sidebar-foreground/70">
                {quiz.length
                  ? quizScore != null
                    ? `Quiz score: ${quizScore}%${quizScore >= 75 ? ' — passed.' : ' — retake it any time to reach 75%.'}`
                    : 'Quiz not taken yet.'
                  : 'This module has no quiz.'}
              </p>
            </div>
          </div>
          <p className="text-[11px] leading-snug text-sidebar-foreground/60">
            Finish the practice checklist and this module is complete.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {stage === 'recap' && (
          <button
            onClick={finishRecap}
            className="flex items-center gap-1.5 rounded-lg bg-sidebar-primary px-3.5 py-1.5 text-xs font-bold text-sidebar-primary-foreground transition-opacity hover:opacity-85"
          >
            {quiz.length ? 'Take the quiz' : 'Finish the recap'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {stage === 'done' && (
          <>
            {!!module.tasks?.length && (
              <button
                onClick={onFinish}
                className="flex items-center gap-1.5 rounded-lg bg-sidebar-primary px-3.5 py-1.5 text-xs font-bold text-sidebar-primary-foreground transition-opacity hover:opacity-85"
              >
                <ListChecks className="h-3.5 w-3.5" /> Start practice
              </button>
            )}
            <button
              onClick={onFinish}
              className="rounded-lg bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-primary transition-opacity hover:opacity-85"
            >
              Finish module
            </button>
            <button
              onClick={() => { setResult(null); setStage('recap'); }}
              className="flex items-center gap-1 rounded-lg bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/80 transition-opacity hover:opacity-85"
            >
              <RotateCcw className="h-3 w-3" /> Replay recap
            </button>
            {!!quiz.length && (
              <button
                onClick={() => { setResult(null); setStage('quiz'); }}
                className="rounded-lg bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/80 transition-opacity hover:opacity-85"
              >
                Retake quiz
              </button>
            )}
          </>
        )}
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-[11px] font-semibold text-sidebar-foreground/60 hover:opacity-80">
            <ArrowLeft className="h-3 w-3" /> Back to the last slide
          </button>
        )}
      </div>
    </div>
  );
}