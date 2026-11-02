// ── Live screen mirroring ─────────────────────────────────────────────────
// While a facilitator presents, their slide is written to one shared record.
// Participants who are listed on the session listen to it and their screen
// takes over with the same slide. Only "slide" is mirrored: the moment the
// facilitator opens practice, a test, the quiz or a wrap-up, the takeover ends
// and it comes back when they return to a slide.

import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getTrainingModule } from "@/lib/training/trainingModules";

const liveSessions = () => base44.entities.TrainingLiveSession;

const RECORD_KEY = "candora-mirror-record";
// A session that stopped reporting (tab closed, laptop shut) stops mirroring
// instead of holding someone's screen forever.
const FRESH_MS = 150000;

const readRecordId = () => {
  try { return sessionStorage.getItem(RECORD_KEY); } catch { return null; }
};
const writeRecordId = (id) => {
  try {
    if (id) sessionStorage.setItem(RECORD_KEY, id);
    else sessionStorage.removeItem(RECORD_KEY);
  } catch { /* ignore */ }
};

const sameEmail = (a, b) => (a || "").toLowerCase().trim() === (b || "").toLowerCase().trim();

// Stop mirroring and remove the shared session (called when a session ends).
export const clearMirrorRecord = async () => {
  const id = readRecordId();
  writeRecordId(null);
  if (!id) return;
  try { await liveSessions().delete(id); } catch { /* already gone */ }
};

// ── Facilitator side: publish the slide they are showing ──────────────────
// `stage` is "slide" | "practice" | "wrapup" | "closed"; only a slide mirrors.
export const useMirrorBroadcast = ({ module, plan, on, stepIndex, stage }) => {
  const { user } = useAuth();
  const latest = useRef({ module, plan, on, stepIndex, stage });
  latest.current = { module, plan, on, stepIndex, stage };

  const payload = ({ module: m, plan: p, on: enabled, stepIndex: i, stage: s }) => ({
    facilitator_email: user?.email || "",
    facilitator_name: user?.full_name || "",
    plan_id: p?.id || "",
    plan_title: p?.title || "",
    module_key: m?.key || "",
    module_title: m?.title || "",
    attendees: (p?.attendees || []).filter(a => a?.email),
    mirroring: !!enabled && s === "slide",
    stage: s || "closed",
    step_index: Number.isFinite(i) ? i : 0,
    step_title: m?.steps?.[i]?.title || "",
    heartbeat: new Date().toISOString(),
  });

  const save = async () => {
    const data = payload(latest.current);
    const id = readRecordId();
    if (id) {
      try { await liveSessions().update(id, data); return; } catch { writeRecordId(null); }
    }
    try {
      const rec = await liveSessions().create(data);
      writeRecordId(rec?.id || null);
    } catch { /* ignore — retried on the next slide change */ }
  };

  // Republish whenever the slide, the stage or the on/off switch changes.
  useEffect(() => {
    if (!module) return;
    if (!latest.current.on && !readRecordId()) return;
    save();
  }, [module?.key, on, stage, stepIndex]);

  // Keep the session fresh while it is live so participants don't drop out
  // between slides.
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => { save(); }, 45000);
    return () => clearInterval(t);
  }, [on, module?.key]);
};

// ── Participant side: follow the session ──────────────────────────────────
// Returns the slide to show, or null when nothing should take over the screen.
export const useMirroredSession = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    liveSessions().filter({ mirroring: true })
      .then(res => {
        const items = res?.items || res || [];
        if (mounted) setRows(items);
      })
      .catch(() => { /* no session / not permitted — nothing to follow */ });

    const unsubscribe = liveSessions().subscribe((event) => {
      const rec = event?.data;
      if (!rec?.id) return;
      setRows(prev => {
        const rest = prev.filter(r => r.id !== rec.id);
        return event.type === "delete" || !rec.mirroring ? rest : [...rest, rec];
      });
    });
    return () => { mounted = false; if (typeof unsubscribe === "function") unsubscribe(); };
  }, []);

  // Re-check freshness so a session that went quiet drops away by itself.
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const live = rows.find(r => {
    if (!r || r.mirroring === false || r.stage !== "slide") return false;
    if (sameEmail(r.facilitator_email, user?.email)) return false;
    const list = r.attendees || [];
    if (list.length && !list.some(a => sameEmail(a?.email, user?.email))) return false;
    const beat = new Date(r.heartbeat || r.updated_date || 0).getTime();
    return beat > 0 && Date.now() - beat < FRESH_MS;
  });

  const module = live ? getTrainingModule(live.module_key) : null;
  return {
    live: live || null,
    module: module || null,
    stepIndex: Number.isFinite(live?.step_index) ? live.step_index : 0,
    tick,
  };
};