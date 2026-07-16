export const DAYS = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
  { value: 6, label: "Sunday", short: "Sun" },
];

export const START_HOUR = 7;   // 7 AM
export const END_HOUR = 19;    // 7 PM
export const HOUR_HEIGHT = 56; // px per hour in the grid

export const CATEGORIES = [
  { value: "meeting",   label: "Meeting",     color: "#3b82f6" },
  { value: "deep_work", label: "Deep Work",   color: "#8b5cf6" },
  { value: "review",    label: "Review",      color: "#f59e0b" },
  { value: "admin",     label: "Admin",       color: "#64748b" },
  { value: "break",     label: "Break",       color: "#22c55e" },
  { value: "external",  label: "External",    color: "#ec4899" },
  { value: "personal",  label: "Personal",    color: "#14b8a6" },
  { value: "other",     label: "Other",       color: "#e2e8f0" },
];

export function categoryColor(cat) {
  return CATEGORIES.find(c => c.value === cat)?.color || "#e2e8f0";
}

export function formatHour(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${displayH} ${period}` : `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

export function snapToInterval(decimal, interval = 0.5) {
  return Math.round(decimal / interval) * interval;
}

export function createEmptyBlock(dayOfWeek) {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    day_of_week: dayOfWeek,
    start_hour: 9,
    end_hour: 10,
    title: "",
    category: "meeting",
    location: "",
    notes: "",
  };
}