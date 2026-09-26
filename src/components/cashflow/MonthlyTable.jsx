import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { orderedCategories, fmtMoney } from "@/lib/cashFlow/engine";
import { format, parseISO } from "date-fns";

const fmtDate = (s) => { try { return format(parseISO(s), "MMM d, yyyy"); } catch { return s; } };

// Monthly projection table. Categories are generated dynamically from the
// assumptions actually in the projection. Click a category row to expand the
// underlying transactions (actual withdrawal/receipt dates — cash-flow based,
// so a Feb 1 withdrawal shows in February even for a January pay period).
export default function MonthlyTable({ projection }) {
  const [expanded, setExpanded] = useState(null);
  if (!projection) {
    return <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">Set an opening balance, opening date and end date to calculate the projection.</div>;
  }

  const { months } = projection;
  const categories = orderedCategories(projection.transactions);
  const cell = "px-3 py-2 text-sm whitespace-nowrap tabular-nums";

  const transactionsFor = (cat) => {
    const rows = [];
    months.forEach((m) => {
      (m.categoryTransactions[cat] || []).forEach((t) => rows.push(t));
    });
    return rows;
  };

  const renderRow = (label, values, opts = {}) => (
    <tr className={`border-b border-border ${opts.strong ? "font-semibold" : ""}`}>
      <td className={`${cell} sticky left-0 bg-card z-10 ${opts.strong ? "" : "text-muted-foreground"}`}>{label}</td>
      {values.map((v, i) => <td key={i} className={`${cell} text-right ${opts.color || ""}`}>{v}</td>)}
    </tr>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={`${cell} sticky left-0 bg-muted/50 z-10 text-left font-semibold`}>Category</th>
              {months.map((m) => <th key={m.key} className={`${cell} text-right font-semibold`}>{m.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {renderRow("Opening Cash", months.map((m) => fmtMoney(m.opening)))}
            {categories.map((cat) => {
              const isOpen = expanded === cat;
              return (
                <Fragment key={cat}>
                  <tr className="border-b border-border cursor-pointer hover:bg-muted/40" onClick={() => setExpanded(isOpen ? null : cat)}>
                    <td className={`${cell} sticky left-0 bg-card z-10`}>
                      <span className="inline-flex items-center gap-1.5">
                        {isOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
                        {cat}
                      </span>
                    </td>
                    {months.map((m) => {
                      const v = m.byCategory[cat];
                      return <td key={m.key} className={`${cell} text-right ${v > 0 ? "text-green-700" : ""}`}>{v === undefined ? "—" : fmtMoney(v)}</td>;
                    })}
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/30">
                      <td colSpan={months.length + 1} className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {transactionsFor(cat).length === 0 && <span className="text-xs text-muted-foreground">No transactions in the projection period.</span>}
                          {transactionsFor(cat).map((t, i) => (
                            <span key={i} className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 inline-flex flex-col">
                              <span className="text-muted-foreground">{fmtDate(t.date)}</span>
                              <span className="font-medium">{fmtMoney(t.amount)} — {t.name}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {renderRow("Net Cash Flow", months.map((m) => fmtMoney(m.net)), { strong: true, color: "" })}
            {renderRow("Closing Cash", months.map((m) => fmtMoney(m.closing)), { strong: true })}
            {renderRow("Lowest Balance", months.map((m) => (m.low ? `${fmtMoney(m.low.balance)} (${fmtDate(m.low.dateStr)})` : "—")), { })}
          </tbody>
        </table>
      </div>
    </div>
  );
}