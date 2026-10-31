import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle2, Circle, RefreshCw, PartyPopper, ExternalLink, Lightbulb } from "lucide-react";
import useTrainingWindowDrag from "@/components/training/useTrainingWindowDrag";
import { getModuleRecap } from "@/lib/training/moduleRecaps";

const snapKey = (key) => `candora-training-snapshots-${key}`;

// Snapshot the sandbox record counts for auto-verified ("created") tasks so we
// can detect when the learner has actually created something.
async function ensureSnapshots(module) {
  const createdTasks = (module.tasks || []).filter(t => t.verify?.kind === "created");
  if (!createdTasks.length) return {};
  let snaps = {};
  try { snaps = JSON.parse(sessionStorage.getItem(snapKey(module.key)) || "{}"); } catch { /* ignore */ }
  for (const t of createdTasks) {
    const ent = t.verify.entity;
    const count = await base44.entities[ent].count();
    if (!(ent in snaps) || snaps[ent] > count) snaps[ent] = count;
  }
  try { sessionStorage.setItem(snapKey(module.key), JSON.stringify(snaps)); } catch { /* ignore */ }
  return snaps;
}

export default function PracticeChecklist({ open, module, progress, updateProgress, onClose }) {
  const navigate = useNavigate();
  const [done, setDone] = useState([]);
  const [checking, setChecking] = useState(false);
  const [snaps, setSnaps] = useState({});
  const [hints, setHints] = useState([]);
  const drag = useTrainingWindowDrag(open, module?.key);

  useEffect(() => {
    if (!open || !module) return;
    setDone(progress?.tasks_done || []);
    (async () => setSnaps(await ensureSnapshots(module)))();
  }, [open, module?.key]);

  if (!open || !module || !module.tasks?.length) return null;

  const isDone = (id) => done.includes(id.id || id);
  const doneCount = module.tasks.filter(t => done.includes(t.id)).length;
  const allDone = doneCount === module.tasks.length;
  // The module also ends with its recap video and quiz
  const recap = getModuleRecap(module.key);
  const wrapUpPending = !!recap && (!progress?.recap_done || (!!recap.quiz?.length && !progress?.quiz_passed));

  const persist = async (list) => {
    setDone(list);
    await updateProgress({ tasks_done: list });
  };

  const checkAll = async () => {
    setChecking(true);
    const list = [...done];
    for (const t of module.tasks) {
      if (list.includes(t.id) || t.verify?.kind !== "created") continue;
      const count = await base44.entities[t.verify.entity].count();
      if (count > (snaps[t.verify.entity] ?? count)) list.push(t.id);
    }
    await persist(list);
    setChecking(false);
  };

  const toggleSelf = async (t) => {
    if (t.verify?.kind === "created") return;
    const list = done.includes(t.id) ? done.filter(x => x !== t.id) : [...done, t.id];
    await persist(list);
  };

  return (
    <div ref={drag.ref} style={drag.style} className="fixed bottom-4 right-4 z-[80] w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto print:hidden">
      <div className="rounded-2xl border shadow-2xl overflow-hidden training-window-glow" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
        <div {...drag.handleProps} className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none touch-none" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "hsl(45, 92%, 65%)" }}>Practice — {module.shortTitle || module.title}</p>
            <p className="text-[11px]" style={{ color: "hsl(230, 30%, 60%)" }}>
              Try it yourself on demo data — {doneCount} of {module.tasks.length} complete
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "hsl(230, 30%, 60%)" }} title="Close checklist">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {!progress?.tour_done && (
            <p className="text-[11px] italic" style={{ color: "hsl(230, 25%, 55%)" }}>
              Tip: finish the guided tour first for a full walkthrough of the portal.
            </p>
          )}
          {module.tasks.map(t => {
            const complete = done.includes(t.id);
            return (
              <div key={t.id} className="rounded-xl p-3" style={{ background: "hsl(230, 60%, 13%)", border: `1px solid ${complete ? "hsl(152, 45%, 30%)" : "hsl(230, 45%, 22%)"}` }}>
                <div className="flex items-start gap-2.5">
                  {complete
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(152, 55%, 55%)" }} />
                    : <Circle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(230, 30%, 50%)" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: complete ? "hsl(152, 50%, 75%)" : "hsl(45, 50%, 90%)", textDecoration: complete ? "line-through" : "none" }}>
                      {t.title}
                    </p>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "hsl(230, 25%, 60%)" }}>{t.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {t.verify?.kind === "created" ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "hsl(230, 50%, 18%)", color: "hsl(230, 25%, 60%)" }}>
                          Auto-checked with "Check my work"
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleSelf(t)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors hover:opacity-80"
                          style={complete
                            ? { background: "hsl(230, 50%, 18%)", color: "hsl(230, 25%, 60%)" }
                            : { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
                        >
                          {complete ? "Undo" : "Mark done"}
                        </button>
                      )}
                      {t.path && (
                        <button
                          onClick={() => navigate(t.path)}
                          className="flex items-center gap-0.5 text-[10px] font-semibold hover:opacity-70"
                          style={{ color: "hsl(45, 70%, 75%)" }}
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </button>
                      )}
                      {t.hint && (
                        <button
                          onClick={() => setHints(h => h.includes(t.id) ? h.filter(x => x !== t.id) : [...h, t.id])}
                          className="flex items-center gap-0.5 text-[10px] font-semibold hover:opacity-70"
                          style={{ color: hints.includes(t.id) ? "hsl(45, 92%, 65%)" : "hsl(230, 30%, 60%)" }}
                        >
                          <Lightbulb className="w-3 h-3" /> {hints.includes(t.id) ? "Hide hint" : "Hint"}
                        </button>
                      )}
                    </div>
                    {t.hint && hints.includes(t.id) && (
                      <p className="text-[11px] mt-2 leading-snug rounded-lg px-2 py-1.5" style={{ background: "hsl(45, 60%, 14%)", color: "hsl(45, 60%, 85%)", border: "1px solid hsl(45, 50%, 25%)" }}>
                        {t.hint}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3" style={{ borderTop: "1px solid hsl(230, 50%, 22%)" }}>
          {allDone ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "hsl(152, 45%, 16%)", border: "1px solid hsl(152, 45%, 30%)" }}>
              <PartyPopper className="w-4 h-4 shrink-0" style={{ color: "hsl(45, 92%, 60%)" }} />
              <p className="text-xs font-semibold" style={{ color: "hsl(152, 50%, 75%)" }}>
                {!progress?.tour_done
                  ? "Practice complete — your training is recorded once you finish the tour."
                  : wrapUpPending
                    ? "Practice complete — finish the \u201cWhat we've learned\u201d recap and quiz to complete this module."
                    : "Practice complete — your training for this portal is recorded! You can exit Training Mode."}
              </p>
            </div>
          ) : (
            <button
              onClick={checkAll}
              disabled={checking}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking..." : "Check my work"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}