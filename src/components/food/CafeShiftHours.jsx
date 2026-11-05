import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { hoursBetween } from '@/lib/cafeHours';

// Hours worked by each staff member assigned to one cafe shift.
export default function CafeShiftHours({ rows, onChange }) {
  if (!rows.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Select staff above and their hours appear here to adjust before submitting the week.
      </p>
    );
  }

  const update = (index, patch) => {
    const next = rows.map((row, i) => {
      if (i !== index) return row;
      const merged = { ...row, ...patch };
      return { ...merged, hours: hoursBetween(merged.start_time, merged.end_time, merged.break_hours) };
    });
    onChange(next);
  };

  const total = rows.reduce((sum, row) => sum + (Number(row.hours) || 0), 0);

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.employee_id} className="rounded-md border bg-white p-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium truncate">{row.employee_name}</span>
            <div className="flex items-center gap-1">
              {row.submitted && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">sent</Badge>}
              <span className="text-xs font-semibold text-blue-700">{row.hours}h</span>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
            <Input
              type="time"
              value={row.start_time}
              onChange={(e) => update(index, { start_time: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              type="time"
              value={row.end_time}
              onChange={(e) => update(index, { end_time: e.target.value })}
              className="h-8 text-xs"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                step="0.25"
                value={row.break_hours}
                onChange={(e) => update(index, { break_hours: e.target.value })}
                className="h-8 w-16 text-xs"
                title="Unpaid break hours"
              />
              <span className="text-[10px] text-muted-foreground">brk</span>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground">
        <Clock className="w-3 h-3" /> {Math.round(total * 100) / 100} hrs on this shift
      </div>
    </div>
  );
}