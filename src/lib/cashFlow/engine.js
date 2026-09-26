// Deterministic cash-flow calculation engine.
// The AI layer NEVER calculates balances — it only produces structured assumptions.
// Everything here is pure, auditable calculation from the structured model.
import { format, addDays, addMonths, differenceInCalendarDays, startOfMonth, startOfWeek } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";

export const FREQUENCIES = [
  { value: "one_time", label: "One time" },
  { value: "weekly", label: "Weekly (every 7 days)" },
  { value: "biweekly", label: "Biweekly (every 14 days)" },
  { value: "semi_monthly", label: "Semi-monthly (1st & 15th)" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "custom", label: "Custom (every N days)" },
];

export const CATEGORY_OPTIONS = {
  inflow: ["Revenue", "Grants/Funding", "Donations", "Social Enterprise", "Other Inflows"],
  outflow: ["Payroll", "Rent", "Benefits", "IT", "Utilities", "Insurance", "Program Expenses", "Contract Expenses", "Other Expenses"],
};

const D = (s) => (s ? parseDateSmart(s) : null);
const iso = (dt) => format(dt, "yyyy-MM-dd");
export const fmtMoney = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? "-$" : "$"}${Math.abs(v).toLocaleString()}`;
};
export const freqLabel = (f) => FREQUENCIES.find((x) => x.value === f)?.label || (f || "").replace(/_/g, " ");

const monthIndex = (dt) => dt.getFullYear() * 12 + dt.getMonth();

// All actual transaction dates for one assumption inside the window, honoring the
// assumption's own start/end bounds. Day-stepped recurrences (weekly/biweekly/custom)
// generate forward AND backward from the anchor so a mid-period anchor still
// produces the correct dates for the whole window.
export function assumptionDates(a, winStart, winEnd) {
  const anchor = D(a.anchor_date);
  const aStart = D(a.start_date);
  const aEnd = D(a.end_date);
  const from = aStart && aStart > winStart ? aStart : winStart;
  const to = aEnd && aEnd < winEnd ? aEnd : winEnd;
  const dates = [];
  const push = (dt) => { if (dt >= from && dt <= to) dates.push(dt); };
  const freq = a.frequency || "monthly";

  if (freq === "one_time") {
    if (anchor) push(anchor);
    return dates;
  }
  if (!anchor) return dates;

  if (["weekly", "biweekly", "custom"].includes(freq)) {
    const step = freq === "weekly" ? 7 : freq === "biweekly" ? 14 : Math.max(1, a.custom_interval_days || 30);
    let k = Math.ceil(differenceInCalendarDays(winStart, anchor) / step);
    let dt = addDays(anchor, k * step);
    while (dt <= to) { push(dt); dt = addDays(dt, step); }
    return dates;
  }

  if (freq === "semi_monthly") {
    let m = startOfMonth(from);
    while (m <= to) {
      push(new Date(m.getFullYear(), m.getMonth(), 1));
      push(new Date(m.getFullYear(), m.getMonth(), 15));
      m = addMonths(m, 1);
    }
    return dates;
  }

  // monthly / quarterly / annually — anchored to the anchor's day of month
  const step = freq === "monthly" ? 1 : freq === "quarterly" ? 3 : 12;
  let k = Math.ceil((monthIndex(from) - monthIndex(anchor)) / step);
  for (;;) {
    const dt = addMonths(anchor, k * step);
    if (dt > to) break;
    push(dt);
    k += 1;
  }
  return dates;
}

// Expand active assumptions into a flat, chronologically sorted transaction list
export function expandTransactions(assumptions, winStart, winEnd) {
  const txs = [];
  (assumptions || []).filter((a) => a.active !== false).forEach((a) => {
    assumptionDates(a, winStart, winEnd).forEach((dt) => {
      txs.push({
        date: dt,
        dateStr: iso(dt),
        amount: a.type === "outflow" ? -Math.abs(a.amount || 0) : Math.abs(a.amount || 0),
        name: a.name,
        category: a.category || (a.type === "outflow" ? "Other Expenses" : "Other Inflows"),
        assumptionId: a.id,
        type: a.type,
      });
    });
  });
  txs.sort((x, y) => x.date - y.date);
  return txs;
}

// Daily-basis projection: opening cash + inflows − outflows = closing cash, per day.
// Month-end balances alone can hide short-term lows, so the low point is found on the daily ledger.
export function computeProjection(rec) {
  const start = D(rec?.opening_date);
  const end = D(rec?.end_date);
  if (!start || !end || end < start) return null;

  const txs = expandTransactions(rec.assumptions || [], start, end);
  const byDay = {};
  txs.forEach((t) => { (byDay[t.dateStr] = byDay[t.dateStr] || []).push(t); });

  const days = [];
  let balance = Number(rec.opening_balance || 0);
  for (let dt = new Date(start); dt <= end; dt = addDays(dt, 1)) {
    const key = iso(dt);
    const list = byDay[key] || [];
    const inflow = list.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0);
    const outflow = list.reduce((s, t) => s + (t.amount < 0 ? -t.amount : 0), 0);
    balance += inflow - outflow;
    days.push({ date: new Date(dt), dateStr: key, inflow, outflow, close: balance });
  }

  const inflows = days.reduce((s, x) => s + x.inflow, 0);
  const outflows = days.reduce((s, x) => s + x.outflow, 0);
  let low = { balance: Infinity, date: null, dateStr: "" };
  days.forEach((x) => { if (x.close < low.balance) low = { balance: x.close, date: x.date, dateStr: x.dateStr }; });

  // Monthly aggregation
  const months = [];
  let cursor = startOfMonth(start);
  while (cursor <= end) {
    const mKey = format(cursor, "yyyy-MM");
    const mDays = days.filter((x) => x.dateStr.startsWith(mKey));
    const list = txs.filter((t) => t.dateStr.startsWith(mKey));
    const byCategory = {};
    const categoryTransactions = {};
    list.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      (categoryTransactions[t.category] = categoryTransactions[t.category] || []).push({ date: t.dateStr, name: t.name, amount: Math.abs(t.amount) });
    });
    const opening = months.length ? months[months.length - 1].closing : Number(rec.opening_balance || 0);
    const mIn = mDays.reduce((s, x) => s + x.inflow, 0);
    const mOut = mDays.reduce((s, x) => s + x.outflow, 0);
    let mLow = { balance: Infinity, dateStr: "" };
    mDays.forEach((x) => { if (x.close < mLow.balance) mLow = { balance: x.close, dateStr: x.dateStr }; });
    months.push({
      key: mKey,
      label: format(cursor, "MMM yy"),
      opening, inflows: mIn, outflows: mOut, net: mIn - mOut,
      closing: opening + mIn - mOut,
      low: mLow.balance === Infinity ? null : mLow,
      byCategory,
      categoryTransactions,
    });
    cursor = addMonths(cursor, 1);
  }

  return {
    days,
    transactions: txs,
    totals: { opening: Number(rec.opening_balance || 0), inflows, outflows, net: inflows - outflows, end: balance },
    low: low.balance === Infinity ? null : { ...low, dateStr: low.dateStr || format(low.date, "yyyy-MM-dd") },
    months,
  };
}

// Inflow categories first, then outflow categories, in order of appearance
export function orderedCategories(txs) {
  const inflow = [];
  const outflow = [];
  (txs || []).forEach((t) => {
    if (t.amount > 0 && !inflow.includes(t.category)) inflow.push(t.category);
    if (t.amount < 0 && !outflow.includes(t.category)) outflow.push(t.category);
  });
  return [...inflow, ...outflow];
}

// Chart series at monthly / weekly / daily granularity
export function chartSeries(proj, granularity) {
  if (!proj) return [];
  if (granularity === "daily") {
    return proj.days.map((x) => ({ label: format(x.date, "MMM d"), date: x.dateStr, balance: x.close }));
  }
  if (granularity === "weekly") {
    const weeks = [];
    let wk = null;
    proj.days.forEach((x) => {
      const k = format(startOfWeek(x.date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      if (!wk || wk.key !== k) { if (wk) weeks.push(wk); wk = { key: k, label: format(startOfWeek(x.date, { weekStartsOn: 1 }), "MMM d"), balance: x.close }; }
      else wk.balance = x.close;
    });
    if (wk) weeks.push(wk);
    return weeks;
  }
  return proj.months.map((m) => ({ label: m.label, date: m.key, balance: m.closing }));
}

// Which assumptions differ between a scenario and its parent projection
export function diffAssumptions(parentList, childList) {
  const p = new Map((parentList || []).map((a) => [a.id, a]));
  const c = new Map((childList || []).map((a) => [a.id, a]));
  const added = (childList || []).filter((a) => !p.has(a.id));
  const removed = (parentList || []).filter((a) => !c.has(a.id));
  const changed = [];
  (childList || []).forEach((a) => {
    const old = p.get(a.id);
    if (!old) return;
    const fields = {};
    ["name", "category", "type", "amount", "frequency", "custom_interval_days", "anchor_date", "start_date", "end_date", "confidence", "active"].forEach((f) => {
      const pv = old[f] ?? null;
      const cv = a[f] ?? null;
      if (String(pv) !== String(cv)) fields[f] = [pv, cv];
    });
    if (Object.keys(fields).length) changed.push({ id: a.id, name: a.name, fields });
  });
  return { added, removed, changed };
}