import { TRAINING_MODULES, getTrainingModule } from "@/lib/training/trainingModules";

// ── Training-day timeline maths ───────────────────────────────────────────
// Times run from the plan's start time through each block's length. A block may
// also carry its own start time (an arrival at 9:15 for a 9:45 training start,
// a guest who is only free at 11:00) — that pins the block and everything after
// it continues from there.

export const MODULE_OPTIONS = TRAINING_MODULES.map(m => ({
  key: m.key,
  label: m.shortTitle || m.title,
}));

export const BLOCK_TYPES = [
  { value: "session", label: "Module" },
  { value: "admin", label: "Admin" },
  { value: "break", label: "Break" },
];

// Typical length of each module when it is taught in a room (from the
// facilitator guides) — used as the default when a module is picked and given
// to the assistant so its timelines add up.
export const MODULE_MINUTES = {
  welcome: 20,
  dashboard: 45,
  dashboard_widgets: 15,
  staffadmin: 40,
  staffadmin_money: 35,
  staffadmin_supervisor: 40,
  pathways: 40,
  pathways_journey: 25,
  pathways_journey_part2: 50,
  pathways_assessment: 30,
  pathways_service_nav: 30,
  pathways_workshops: 25,
  central_database_basics: 40,
  central_database_advanced: 40,
  filemanager: 25,
  filemanager_advanced: 30,
};

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "09:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const formatClock = (mins) => {
  const t = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

// Minutes → HH:MM, for the editable start-time inputs.
export const toClockInput = (mins) => {
  const t = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

// Blocks with their calculated start/end, plus where the day lands.
export function withTimes(plan) {
  let cursor = toMinutes(plan?.start_time || "09:00");
  const blocks = (plan?.blocks || []).map((b, index) => {
    // A block's own start time wins over the running clock.
    const start = b.start_time ? toMinutes(b.start_time) : cursor;
    const minutes = Math.max(0, Number(b.minutes) || 0);
    const end = start + minutes;
    cursor = end;
    return {
      ...b,
      index,
      minutes,
      startMinutes: start,
      startHHMM: toClockInput(start),
      endHHMM: toClockInput(end),
      endTime: formatClock(end),
      pinned: Boolean(b.start_time),
      time: `${formatClock(start)} – ${formatClock(end)}`,
      module: b.module_key ? getTrainingModule(b.module_key) : null,
    };
  });
  return { blocks, endMinutes: cursor, endTime: formatClock(cursor) };
}

export function planStats(plan) {
  const { blocks, endTime } = withTimes(plan);
  const teaching = blocks.filter(b => b.type === "session").reduce((n, b) => n + b.minutes, 0);
  const pauses = blocks.filter(b => b.type !== "session").reduce((n, b) => n + b.minutes, 0);
  return { teaching, pauses, endTime, blockCount: blocks.length };
}

export const emptyBlock = (type = "session") => ({
  type,
  title: type === "break" ? "Break" : type === "admin" ? "Admin" : "New block",
  minutes: type === "break" ? 15 : 20,
  start_time: "",
  module_key: "",
  why: "",
  cue: "",
  activities: [],
});

// Only the fields the entity stores — computed times are never written back.
export const stripComputed = (blocks = []) =>
  blocks.map(b => ({
    type: b.type || "session",
    title: b.title || "",
    minutes: Math.max(0, Number(b.minutes) || 0),
    start_time: b.start_time || "",
    module_key: b.module_key || "",
    why: b.why || "",
    cue: b.cue || "",
    activities: (b.activities || []).filter(a => String(a).trim()),
  }));