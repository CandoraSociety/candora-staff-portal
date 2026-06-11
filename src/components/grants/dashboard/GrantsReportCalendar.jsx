import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, parseISO, addMonths, subMonths } from 'date-fns';
import GrantsDeadlineDetailPopup from './GrantsDeadlineDetailPopup';

const TYPE_COLORS = {
  report: 'bg-blue-500',
  proposal: 'bg-amber-500',
  milestone: 'bg-purple-500',
};

export default function GrantsReportCalendar({ reports = [], projects = [], milestones = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [popupDeadlines, setPopupDeadlines] = useState([]);

  const deadlines = [];
  reports.forEach(r => {
    if (r.due_date) deadlines.push({ id: `r-${r.id}`, type: 'report', date: r.due_date, title: r.title, project_id: r.project_id });
  });
  projects.forEach(p => {
    if (p.submission_deadline) deadlines.push({ id: `p-${p.id}`, type: 'proposal', date: p.submission_deadline, title: p.title, project_id: p.id });
  });
  milestones.forEach(m => {
    if (m.due_date) deadlines.push({ id: `m-${m.id}`, type: 'milestone', date: m.due_date, title: m.title, project_id: m.project_id });
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getDeadlinesForDay = (day) => deadlines.filter(d => isSameDay(parseISO(d.date), day));

  const handleDayClick = (day) => {
    const dl = getDeadlinesForDay(day);
    if (dl.length > 0) {
      setSelectedDay(day);
      setPopupDeadlines(dl);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Deadline Calendar</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-28 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px text-center mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-xs text-muted-foreground py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const dl = getDeadlinesForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs transition-colors
                  ${dl.length > 0 ? 'cursor-pointer hover:bg-muted' : 'cursor-default'}
                  ${isToday ? 'font-bold text-primary ring-1 ring-primary' : 'text-foreground'}
                `}
              >
                <span>{format(day, 'd')}</span>
                {dl.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dl.slice(0, 3).map(d => (
                      <span key={d.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[d.type] || 'bg-gray-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {type}
            </span>
          ))}
        </div>
        {selectedDay && popupDeadlines.length > 0 && (
          <GrantsDeadlineDetailPopup
            day={selectedDay}
            deadlines={popupDeadlines}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}