import { useEffect } from "react";
import { X, Printer, Clock, Target, ClipboardCheck, Lightbulb } from "lucide-react";
import { getFacilitatorGuide } from "@/lib/training/facilitatorGuide";

// Printable per-module facilitator run-sheet: timings, objectives,
// preparation, per-step talking points, practice coaching notes and tips.
// Opened from the Training Hub; the body.runsheet-printing class makes the
// print output contain only the run-sheet document.
export default function FacilitatorRunSheet({ module, open, onClose }) {
  const guide = getFacilitatorGuide(module.key);

  // While the run-sheet overlay is open, printing outputs only the run-sheet.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("runsheet-printing");
    return () => document.body.classList.remove("runsheet-printing");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 overflow-y-auto p-4 sm:p-8">
      <div className="facilitator-runsheet mx-auto max-w-3xl">
        <div className="runsheet-card bg-white rounded-2xl shadow-2xl p-8 text-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Candora Staff Portal — Facilitator Run-Sheet</p>
              <h1 className="text-2xl font-bold mt-1">{module.title}</h1>
              <p className="text-sm text-slate-600 mt-1">{module.blurb}</p>
              {guide?.duration && (
                <p className="flex items-center gap-1.5 text-sm text-slate-700 mt-2 font-medium">
                  <Clock className="w-4 h-4" /> {guide.duration}
                </p>
              )}
            </div>
            <div className="flex gap-2 print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-700"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>

          {guide?.objectives?.length > 0 && (
            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Target className="w-4 h-4" /> Session objectives
              </h2>
              <ul className="mt-2 space-y-1">
                {guide.objectives.map((o, i) => (
                  <li key={i} className="text-sm flex gap-2"><span className="text-slate-400">•</span>{o}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              <ClipboardCheck className="w-4 h-4" /> Before you start
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex gap-2"><span className="text-slate-400">•</span>Projector or large screen connected, tour ready in presentation mode (start the session from the Training Hub).</li>
              <li className="flex gap-2"><span className="text-slate-400">•</span>Every learner signed in on their own device with their own account.</li>
              <li className="flex gap-2"><span className="text-slate-400">•</span>Tell the group up front: training runs on simulated data — nothing they do in the session affects real records.</li>
              <li className="flex gap-2"><span className="text-slate-400">•</span>Learners start their own training from the Training button at the bottom of the portal, so progress is tracked per person.</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Guided tour — talking points</h2>
            <div className="mt-2 space-y-3">
              {module.steps.map((s, i) => (
                <div key={i} className="border-l-4 border-yellow-400 pl-3">
                  <p className="text-sm font-bold">{i + 1}. {s.title}</p>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {guide?.stepNotes?.[s.title] || s.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {!!module.tasks?.length && (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Practice — coaching notes</h2>
              <div className="mt-2 space-y-3">
                {module.tasks.map((t, i) => (
                  <div key={t.id} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-bold">{i + 1}. {t.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{t.body}</p>
                    {guide?.practiceNotes?.[t.id] && (
                      <p className="text-sm text-slate-800 mt-1.5 flex gap-1.5">
                        <Lightbulb className="w-4 h-4 shrink-0 text-yellow-500" /> {guide.practiceNotes[t.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {guide?.tips?.length > 0 && (
            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Lightbulb className="w-4 h-4" /> Facilitator tips
              </h2>
              <ul className="mt-2 space-y-1">
                {guide.tips.map((t, i) => (
                  <li key={i} className="text-sm flex gap-2"><span className="text-slate-400">•</span>{t}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-200">
            After the session: progress for each learner appears in the Training Hub (refresh to see the latest). Learners who want to repeat the training can use "Start over" in the training pill.
          </p>
        </div>
      </div>
    </div>
  );
}