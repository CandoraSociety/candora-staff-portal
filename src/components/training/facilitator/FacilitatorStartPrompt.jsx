import { useState } from "react";
import { Check, ClipboardCheck, Download, FileText, Loader2, Printer, Send, X } from "lucide-react";
import { getBriefingItems, getModuleObjectives, getRoomHandouts } from "@/lib/training/facilitatorResources";
import { downloadHandout, shareHandoutWithParticipants } from "@/lib/training/shareHandout";
import HandoutPrintDialog from "@/components/training/plan/HandoutPrintDialog";

// The opening prompt of a facilitated session. It exists so a facilitator never
// walks into a room without the handouts in place: everything to distribute and
// everything to switch on is listed here, before the first slide.
export default function FacilitatorStartPrompt({ open, module, plan, onBegin }) {
  const [checked, setChecked] = useState({});
  const [handout, setHandout] = useState(null);
  const [share, setShare] = useState({});

  if (!open) return null;

  const items = getBriefingItems(module, plan);
  const handouts = getRoomHandouts(module, plan);
  const attendees = (plan?.attendees || []).filter(a => a?.email);
  const objectives = getModuleObjectives(module);
  const remaining = items.filter(i => !checked[i.id]).length;

  const shareFile = async (h) => {
    setShare(prev => ({ ...prev, [h.id]: { busy: true } }));
    try {
      const { count } = await shareHandoutWithParticipants({ handout: h, plan });
      setShare(prev => ({
        ...prev,
        [h.id]: { message: count ? `Sent to ${count} participant${count === 1 ? "" : "s"}` : "No participants added to this day yet." },
      }));
    } catch {
      setShare(prev => ({ ...prev, [h.id]: { message: "Couldn't share it — try again." } }));
    }
  };

  return (
    <div className="fixed inset-0 z-[10030] overflow-y-auto p-4 sm:p-8 print:hidden" style={{ background: "hsl(230 70% 5% / 0.86)" }}>
      <div className="mx-auto w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}>
        <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(45, 70%, 65%)" }}>
              Before the room arrives
            </p>
            <h2 className="text-xl font-bold mt-1" style={{ color: "hsl(45, 60%, 94%)" }}>
              {module?.title || "Facilitated session"}
            </h2>
            <p className="text-sm mt-1" style={{ color: "hsl(230, 25%, 72%)" }}>
              Hand out what participants need, then get the room ready. Nothing here blocks you.
            </p>
          </div>
          <button onClick={onBegin} className="p-1.5 rounded-lg hover:opacity-70 shrink-0" style={{ color: "hsl(230, 30%, 60%)" }} title="Skip the briefing">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Handouts to distribute */}
          {handouts.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: "hsl(45, 92%, 53%, 0.12)", border: "1px solid hsl(45, 70%, 45%)" }}>
              <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "hsl(45, 80%, 72%)" }}>
                <FileText className="w-3.5 h-3.5" /> Hand these out as people arrive
              </p>
              <p className="text-[11px] mt-1" style={{ color: "hsl(230, 25%, 70%)" }}>
                {attendees.length
                  ? `Download a copy or share it — sharing sends it to the ${attendees.length} participant${attendees.length === 1 ? "" : "s"} on this training day.`
                  : "Download a copy to print. Add participants on the training day card to share files with the room."}
              </p>
              <div className="mt-2 space-y-1.5">
                {handouts.map(h => {
                  const state = share[h.id] || {};
                  return (
                    <div
                      key={h.id}
                      className="rounded-lg"
                      style={{ background: "hsl(230, 60%, 13%)", border: "1px solid hsl(230, 45%, 24%)" }}
                    >
                      <button
                        onClick={() => setHandout(h)}
                        className="w-full flex items-center gap-2 px-2.5 pt-2 pb-1.5 text-left hover:opacity-90"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold" style={{ color: "hsl(45, 50%, 92%)" }}>{h.title}</span>
                          <span className="block text-[11px]" style={{ color: "hsl(230, 25%, 65%)" }}>{h.blurb}</span>
                        </span>
                        <Printer className="w-4 h-4 shrink-0" style={{ color: "hsl(45, 92%, 60%)" }} />
                      </button>
                      <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-2">
                        <button
                          onClick={() => downloadHandout({ handout: h, plan })}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold hover:opacity-90"
                          style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 88%)" }}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          onClick={() => shareFile(h)}
                          disabled={!attendees.length || state.busy}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold hover:opacity-90 disabled:opacity-40"
                          style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
                          title={attendees.length ? "Send this file to every participant's notifications" : "Add participants first"}
                        >
                          {state.busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Share with participants
                        </button>
                        {state.message && (
                          <span className="text-[11px]" style={{ color: "hsl(152, 45%, 72%)" }}>{state.message}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Readiness checklist */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "hsl(45, 70%, 65%)" }}>
              <ClipboardCheck className="w-3.5 h-3.5" /> Getting the room ready
            </p>
            <div className="mt-2 space-y-1.5">
              {items.map(item => {
                const on = !!checked[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => setChecked(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{ background: on ? "hsl(152, 40%, 16%)" : "hsl(230, 60%, 13%)", border: `1px solid ${on ? "hsl(152, 45%, 32%)" : "hsl(230, 45%, 24%)"}` }}
                  >
                    <span className="mt-0.5 flex items-center justify-center w-4 h-4 rounded shrink-0" style={{ background: on ? "hsl(152, 55%, 40%)" : "transparent", border: `1.5px solid ${on ? "hsl(152, 55%, 45%)" : "hsl(230, 35%, 45%)"}` }}>
                      {on && <Check className="w-3 h-3" style={{ color: "hsl(230, 70%, 10%)" }} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium" style={{ color: on ? "hsl(152, 45%, 82%)" : "hsl(45, 40%, 90%)" }}>{item.label}</span>
                      {item.detail && <span className="block text-[11px] mt-0.5 leading-snug" style={{ color: "hsl(230, 25%, 65%)" }}>{item.detail}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {objectives.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: "hsl(230, 60%, 13%)", border: "1px solid hsl(230, 45%, 24%)" }}>
              <p className="text-xs font-bold" style={{ color: "hsl(45, 70%, 70%)" }}>By the end of this session</p>
              <ul className="mt-1.5 space-y-1">
                {objectives.map((o, i) => (
                  <li key={i} className="text-[12px] leading-snug flex gap-1.5" style={{ color: "hsl(45, 40%, 88%)" }}>
                    <span style={{ color: "hsl(45, 92%, 53%)" }}>•</span>{o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" style={{ borderTop: "1px solid hsl(230, 50%, 22%)" }}>
          <span className="text-[11px]" style={{ color: "hsl(230, 25%, 62%)" }}>
            {remaining === 0 ? "Room ready." : `${remaining} item${remaining === 1 ? "" : "s"} still to check`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onBegin}
              className="px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90"
              style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 88%)" }}
            >
              Dismiss
            </button>
            <button
              onClick={onBegin}
              className="px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90"
              style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              Begin the session
            </button>
          </div>
        </div>
      </div>

      <HandoutPrintDialog open={!!handout} handout={handout} plan={plan} onClose={() => setHandout(null)} />
    </div>
  );
}