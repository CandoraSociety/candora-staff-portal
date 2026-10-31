import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ListChecks, X } from 'lucide-react';
import ModuleRecapVideo from '@/components/training/ModuleRecapVideo';
import ModuleQuiz from '@/components/training/ModuleQuiz';
import { getModuleRecap } from '@/lib/training/moduleRecaps';
import useTrainingWindowDrag from '@/components/training/useTrainingWindowDrag';

// The end-of-module wrap-up: the "what we've learned" recap video first, then
// the quiz, then a short summary. Results are written to TrainingProgress
// (recap_done, quiz_score, quiz_passed) so the module only completes once the
// whole ending has been done.
export default function ModuleWrapUp({ open, module, progress, updateProgress, startStage = 'recap', onClose, onStartPractice }) {
  const recap = getModuleRecap(module?.key);
  const quiz = recap?.quiz || [];
  const [stage, setStage] = useState(startStage);
  const [result, setResult] = useState(null);
  const drag = useTrainingWindowDrag(open, module?.key);

  useEffect(() => {
    if (!open) return;
    setStage(startStage);
    setResult(null);
  }, [open, startStage, module?.key]);

  if (!open || !module || !recap) return null;

  const save = async (fields) => { await updateProgress(fields); };

  const finishRecap = async () => {
    if (!progress?.recap_done) await save({ recap_done: true });
    if (quiz.length) setStage('quiz');
    else setStage('done');
  };

  const finishQuiz = async ({ score, passed }) => {
    setResult({ score, passed });
    await save({
      recap_done: true,
      quiz_score: score,
      quiz_passed: passed,
      quiz_done_date: new Date().toISOString(),
    });
    setStage('done');
  };

  // The just-taken score shows immediately; otherwise the saved one.
  const quizScore = result?.score ?? progress?.quiz_score;

  return (
    <div ref={drag.ref} style={drag.style} className="fixed bottom-4 right-4 z-[85] w-[430px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto print:hidden">
      <div className="training-window-glow overflow-hidden rounded-2xl border shadow-2xl" style={{ background: 'hsl(230, 70%, 10%)', borderColor: 'hsl(230, 50%, 22%)' }}>
        <div {...drag.handleProps} className="flex cursor-grab select-none items-center justify-between px-4 py-3 active:cursor-grabbing touch-none" style={{ background: 'hsl(230, 70%, 14%)', borderBottom: '1px solid hsl(230, 50%, 22%)' }}>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: 'hsl(45, 92%, 65%)' }}>
              What we've learned — {module.shortTitle || module.title}
            </p>
            <p className="text-[11px]" style={{ color: 'hsl(230, 30%, 60%)' }}>
              {stage === 'recap' ? 'Recap video' : stage === 'quiz' ? 'Quiz' : 'Wrap-up complete'}
              {quiz.length ? ` · ${quiz.length} questions` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:opacity-70" style={{ color: 'hsl(230, 30%, 60%)' }} title="Close wrap-up">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {stage === 'recap' && <ModuleRecapVideo recap={recap} moduleKey={module.key} />}

          {stage === 'quiz' && <ModuleQuiz quiz={quiz} onComplete={finishQuiz} />}

          {stage === 'done' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: 'hsl(152, 40%, 14%)', border: '1px solid hsl(152, 45%, 30%)' }}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'hsl(152, 55%, 62%)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'hsl(152, 50%, 80%)' }}>Recap complete</p>
                  <p className="text-[11px] leading-snug" style={{ color: 'hsl(152, 40%, 72%)' }}>
                    {quiz.length
                      ? quizScore != null
                        ? `Quiz score: ${quizScore}%${quizScore >= 75 ? ' — passed.' : ' — retake it any time to reach 75%.'}`
                        : 'Quiz not taken yet.'
                      : 'This module has no quiz.'}
                  </p>
                </div>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: 'hsl(230, 25%, 62%)' }}>
                Finish the practice checklist and this module is complete.
              </p>
              <div className="flex flex-wrap gap-2">
                {!!module.tasks?.length && (
                  <button
                    onClick={onStartPractice}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
                    style={{ background: 'hsl(45, 92%, 53%)', color: 'hsl(230, 70%, 10%)' }}
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Start practice
                  </button>
                )}
                <button
                  onClick={() => setStage('recap')}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ background: 'hsl(230, 55%, 20%)', color: 'hsl(45, 60%, 85%)' }}
                >
                  Replay recap
                </button>
                {!!quiz.length && (
                  <button
                    onClick={() => setStage('quiz')}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ background: 'hsl(230, 55%, 20%)', color: 'hsl(45, 60%, 85%)' }}
                  >
                    Retake quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {stage === 'recap' && (
          <div className="flex items-center justify-end px-4 py-3" style={{ borderTop: '1px solid hsl(230, 50%, 22%)' }}>
            <button
              onClick={finishRecap}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
              style={{ background: 'hsl(45, 92%, 53%)', color: 'hsl(230, 70%, 10%)' }}
            >
              {quiz.length ? 'Take the quiz' : 'Finish the recap'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}