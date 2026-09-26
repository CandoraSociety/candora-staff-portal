import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from "recharts";
import { chartSeries, fmtMoney } from "@/lib/cashFlow/engine";

const GRANULARITIES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
];

// Projected cash balance over time. Monthly closing balances by default, with a
// weekly/daily toggle; the lowest projected point is clearly identified.
export default function CashFlowChart({ projection }) {
  const [granularity, setGranularity] = useState("monthly");
  if (!projection) {
    return <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">Chart appears once the projection is calculable.</div>;
  }

  const data = chartSeries(projection, granularity);
  const minPoint = data.reduce((min, x) => (x.balance < min.balance ? x : min), { balance: Infinity, label: "", date: "" });
  const lowIsVisible = minPoint.balance !== Infinity;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="font-semibold text-sm">Projected Cash Balance</h3>
          {lowIsVisible && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Lowest projected point: <span className="text-red-600 font-medium">{fmtMoney(minPoint.balance)}</span> on {(() => { try { return format(parseISO(minPoint.date), "MMMM d, yyyy"); } catch { return minPoint.label; } })()}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {GRANULARITIES.map((g) => (
            <button key={g.value} onClick={() => setGranularity(g.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${granularity === g.value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip formatter={(v) => fmtMoney(v)} labelFormatter={(l) => `Balance at ${l}`} />
            <Line type="monotone" dataKey="balance" stroke="hsl(230,75%,25%)" strokeWidth={2.5} dot={false} />
            {lowIsVisible && (
              <ReferenceDot
                x={minPoint.label}
                y={minPoint.balance}
                r={6}
                fill="hsl(0,72%,51%)"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {lowIsVisible && granularity === "monthly" && (
        <p className="text-[11px] text-muted-foreground mt-2">Monthly view shows month-end balances — switch to Weekly or Daily to see intra-month low points.</p>
      )}
    </div>
  );
}