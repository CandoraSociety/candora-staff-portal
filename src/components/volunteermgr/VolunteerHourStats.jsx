import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment";

export default function VolunteerHourStats({ timeLogs = [] }) {
  const today = moment();
  const currentYear = today.year();

  const fiscalYearStart = today.month() >= 3
    ? moment(`${currentYear}-04-01`)
    : moment(`${currentYear - 1}-04-01`);
  const prevFiscalYearStart = fiscalYearStart.clone().subtract(1, "year");
  const prevFiscalYearEnd = fiscalYearStart.clone().subtract(1, "day");

  const prevCalYear = currentYear - 1;
  const calYTDStart = moment(`${currentYear}-01-01`);

  const stats = useMemo(() => {
    const total = timeLogs.reduce((s, l) => s + (l.total_hours || 0), 0);

    const calYTD = timeLogs.filter(l => {
      if (!l.date) return false;
      const d = moment(l.date);
      return d.isSameOrAfter(calYTDStart) && d.isSameOrBefore(today);
    }).reduce((s, l) => s + (l.total_hours || 0), 0);

    const fiscalYTD = timeLogs.filter(l => {
      if (!l.date) return false;
      const d = moment(l.date);
      return d.isSameOrAfter(fiscalYearStart) && d.isSameOrBefore(today);
    }).reduce((s, l) => s + (l.total_hours || 0), 0);

    const prevCal = timeLogs.filter(l => {
      if (!l.date) return false;
      return moment(l.date).year() === prevCalYear;
    }).reduce((s, l) => s + (l.total_hours || 0), 0);

    const prevFiscal = timeLogs.filter(l => {
      if (!l.date) return false;
      const d = moment(l.date);
      return d.isSameOrAfter(prevFiscalYearStart) && d.isSameOrBefore(prevFiscalYearEnd);
    }).reduce((s, l) => s + (l.total_hours || 0), 0);

    return { total, calYTD, fiscalYTD, prevCal, prevFiscal };
  }, [timeLogs]);

  const items = [
    { label: "Total Hours (All Time)", value: stats.total, sub: null },
    { label: `Calendar YTD (${currentYear})`, value: stats.calYTD, sub: "Jan 1 – Today" },
    { label: `Fiscal YTD`, value: stats.fiscalYTD, sub: `Apr 1 ${fiscalYearStart.year()} – Today` },
    { label: `Previous Calendar Year (${prevCalYear})`, value: stats.prevCal, sub: null },
    { label: `Previous Fiscal Year`, value: stats.prevFiscal, sub: `Apr ${prevFiscalYearStart.year()} – Mar ${fiscalYearStart.year()}` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Hour Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
            </div>
            <p className="text-lg font-bold">{item.value.toFixed(1)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}