// Natural-language → structured-assumption interpreter.
// The AI converts information and instructions into structured changes; it NEVER
// calculates balances — answers to questions must come from the deterministic
// engine output passed in the prompt.
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { computeProjection, fmtMoney, freqLabel } from "./engine";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["changes", "question", "clarify"] },
    clarification: { type: "string", description: "The single precise question to ask when kind is clarify" },
    answer: { type: "string", description: "Answer to the user's question, using ONLY numbers from the computed projection data. Markdown allowed." },
    interpretation: { type: "string", description: "Human-readable summary of exactly what will change, including any minor assumptions made (e.g. 'Monthly operating revenue: $80,000 → $70,000 effective November 1 onward. Anchored biweekly payroll to the 6th — adjust if withdrawals fall elsewhere.')" },
    meta_changes: {
      type: "object",
      properties: {
        name: { type: "string" },
        opening_balance: { type: "number" },
        opening_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD" },
      },
    },
    operations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          op: { type: "string", enum: ["add", "update", "remove"] },
          id: { type: "string", description: "For update/remove: the matching assumption id from the current assumptions list" },
          assumption: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              type: { type: "string", enum: ["inflow", "outflow"] },
              amount: { type: "number" },
              frequency: { type: "string", enum: ["one_time", "weekly", "biweekly", "semi_monthly", "monthly", "quarterly", "annually", "custom"] },
              custom_interval_days: { type: "number" },
              anchor_date: { type: "string", description: "YYYY-MM-DD" },
              start_date: { type: "string", description: "YYYY-MM-DD" },
              end_date: { type: "string", description: "YYYY-MM-DD" },
              description: { type: "string" },
              confidence: { type: "string", enum: ["confirmed", "estimate", "conservative_estimate"] },
            },
          },
        },
        required: ["op"],
      },
    },
  },
  required: ["kind"],
};

const SYSTEM_RULES = () => `You are the Cash Flow Assistant inside Candora's Finance Portal. You convert natural-language financial information into structured changes to a cash-flow projection.

ABSOLUTE RULES
1. NEVER calculate balances, totals or dates yourself. Everything in the COMPUTED PROJECTION section was calculated by the application and is authoritative — when answering questions, quote those numbers exactly and never recompute anything.
2. Biweekly means every 14 days. NEVER convert biweekly to twice per month. (For twice a month, use semi_monthly.)
3. Do not silently make important assumptions. Minor defaults are allowed if stated in "interpretation". If something is materially ambiguous (a biweekly or weekly payroll with no withdrawal/anchor date, an unclear base for an increase, an assumption that matches nothing), return kind "clarify" with ONE precise question.
4. All dates are YYYY-MM-DD. Today is ${format(new Date(), "yyyy-MM-dd")}. Resolve relative phrases ("beginning January", "through the end of March") into concrete dates.

FREQUENCIES
one_time, weekly (every 7 days), biweekly (every 14 days), semi_monthly (1st and 15th), monthly, quarterly, annually, custom (set custom_interval_days).
anchor_date is the defining occurrence — the app generates the actual transaction dates forward AND backward from it (e.g. biweekly payroll anchored to Oct 6 pays out Oct 6, Oct 20, Nov 3…). For monthly/quarterly/annually the anchor fixes the day of month. Use start_date/end_date on an assumption to bound when it applies (e.g. "beginning January" → start_date; "through December" → end_date).

CATEGORIES
Inflows: Revenue, Grants/Funding, Donations, Social Enterprise, Other Inflows.
Outflows: Payroll, Rent, Benefits, IT, Utilities, Insurance, Program Expenses, Contract Expenses, Other Expenses.

OPERATIONS
- "add": a full assumption object (name, category, type "inflow"|"outflow", amount, frequency, anchor_date, custom_interval_days if custom, start_date/end_date where applicable, description, confidence).
- "update": the matching "id" from the CURRENT ASSUMPTIONS list plus ONLY the fields that change.
- "remove": just the matching "id".

RESPONSE KINDS
- "question": the user asked for information → answer from the computed data only.
- "clarify": material ambiguity → one precise question.
- "changes": the user wants to change the model → provide operations and/or meta_changes (opening_balance, opening_date, end_date, name), and an "interpretation" that lists each change clearly, including any minor assumptions you made.`;

// Compact, id-addressable listing of the structured model for the prompt
export function buildAssumptionLines(assumptions = []) {
  return assumptions
    .map((a) => `- [${a.id}] ${a.name} | ${a.category} | ${a.type} | ${fmtMoney(a.amount)} | ${freqLabel(a.frequency)}${a.frequency === "custom" ? ` (${a.custom_interval_days || "?"} days)` : ""} | anchor ${a.anchor_date || "—"}${a.start_date ? ` | from ${a.start_date}` : ""}${a.end_date ? ` | until ${a.end_date}` : ""} | ${a.active === false ? "inactive" : "active"}`)
    .join("\n");
}

// Authoritative computed numbers for the prompt (and for EA answers)
export function buildProjectionSummary(rec) {
  if (!rec) return "No cash flow projection set up yet.";
  const proj = computeProjection(rec);
  if (!proj) return "Projection not computable yet — an opening balance, opening date and end date are needed.";
  const monthLines = proj.months
    .map((m) => `  ${m.label}: opening ${fmtMoney(m.opening)}, inflows ${fmtMoney(m.inflows)}, outflows ${fmtMoney(m.outflows)}, closing ${fmtMoney(m.closing)}, lowest ${m.low ? `${fmtMoney(m.low.balance)} on ${m.low.dateStr}` : "—"}`)
    .join("\n");
  return `Opening cash on ${rec.opening_date}: ${fmtMoney(proj.totals.opening)}
Period: ${rec.opening_date} to ${rec.end_date}
Total projected inflows: ${fmtMoney(proj.totals.inflows)}
Total projected outflows: ${fmtMoney(proj.totals.outflows)}
Projected ending cash: ${fmtMoney(proj.totals.end)}
Lowest projected balance: ${fmtMoney(proj.low.balance)} on ${format(proj.low.date, "MMMM d, yyyy")}
Monthly detail:
${monthLines}`;
}

export async function interpretCashFlowMessage({ message, projection, history = "" }) {
  const rec = projection || {};
  const prompt = `${SYSTEM_RULES()}

=== CURRENT PROJECTION SETTINGS ===
Name: ${rec.name || "—"}
Opening balance: ${rec.opening_balance ?? "not set"}
Opening date: ${rec.opening_date || "not set"}
Projection end date: ${rec.end_date || "not set"}

=== CURRENT ASSUMPTIONS ===
${buildAssumptionLines(rec.assumptions) || "None yet."}

=== COMPUTED PROJECTION (authoritative — answer questions from these numbers only, never recalculate) ===
${buildProjectionSummary(rec)}
${history ? `\n=== RECENT CONVERSATION ===\n${history}\n` : ""}
=== USER MESSAGE ===
${message}

Respond with the JSON object as specified.`;

  const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: RESPONSE_SCHEMA });
  return res;
}

// Human-readable change list for the confirm card
export function describeOperations(operations, assumptions = []) {
  const find = (id) => (assumptions || []).find((a) => a.id === id);
  return (operations || []).map((op) => {
    if (op.op === "add") {
      const a = op.assumption || {};
      return `Add "${a.name}" — ${a.type === "outflow" ? "expense" : "income"} · ${a.category} · ${fmtMoney(a.amount)} · ${freqLabel(a.frequency)}${a.anchor_date ? ` from ${a.anchor_date}` : ""}`;
    }
    if (op.op === "update") {
      const old = find(op.id);
      const changes = Object.entries(op.assumption || {})
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${old?.[k] ?? "—"} → ${v}`)
        .join("; ");
      return `Update "${old?.name || op.id}" — ${changes}`;
    }
    if (op.op === "remove") {
      const old = find(op.id);
      return `Remove "${old?.name || op.id}"`;
    }
    return "";
  }).filter(Boolean);
}

export function describeMetaChanges(meta = {}) {
  const parts = [];
  if (meta?.opening_balance !== undefined && meta?.opening_balance !== null) parts.push(`Opening balance → ${fmtMoney(meta.opening_balance)}`);
  if (meta?.opening_date) parts.push(`Opening date → ${meta.opening_date}`);
  if (meta?.end_date) parts.push(`Projection end date → ${meta.end_date}`);
  if (meta?.name) parts.push(`Name → ${meta.name}`);
  return parts;
}