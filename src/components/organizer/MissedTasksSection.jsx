import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Pause, Trash2, CalendarClock, ChevronDown, ChevronUp } from "lucide-react";
import { format, addDays, parseISO, isSameDay } from "date-fns";

export default function MissedTasksSection({ missedItems = [], onHoldItems = [], onReschedule, onHold, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  if (missedItems.length === 0 && onHoldItems.length === 0) return null;

  const startReschedule = (item) => {
    setRescheduleId(item.id);
    setNewDate(item.scheduled_date);
    setNewTime(item.time || "");
  };

  const confirmReschedule = () => {
    if (!rescheduleId || !newDate) return;
    onReschedule(rescheduleId, newDate, newTime);
    setRescheduleId(null);
    setNewDate("");
    setNewTime("");
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40">
      <button
        className="w-full flex items-center gap-2 px-3 py-2"
        onClick={() => setCollapsed(c => !c)}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">
          Missed / On Hold
        </span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-200/60 text-amber-800">
          {missedItems.length + onHoldItems.length}
        </Badge>
        <div className="ml-auto">
          {collapsed ? <ChevronDown className="w-3 h-3 text-amber-600" /> : <ChevronUp className="w-3 h-3 text-amber-600" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5">
          {missedItems.map(item => (
            <div key={item.id} className="rounded-md bg-white border border-amber-200/70 p-2">
              <div className="flex items-start gap-1.5">
                <Clock className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{item.text}</span>
                  <div className="text-[10px] text-muted-foreground">
                    Was: {format(parseISO(item.scheduled_date), "MMM d")}{item.time ? ` at ${item.time}` : ""}
                  </div>
                  {item.notes && <div className="text-[10px] text-muted-foreground italic mt-0.5">"{item.notes}"</div>}
                </div>
              </div>

              {rescheduleId === item.id ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-7 text-xs flex-1" />
                  <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-7 text-xs w-20" />
                  <Button size="sm" className="h-7 text-xs" onClick={confirmReschedule}>OK</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setRescheduleId(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1.5">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => startReschedule(item)}>
                    <CalendarClock className="w-2.5 h-2.5 mr-0.5" /> Reschedule
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onHold(item.id)}>
                    <Pause className="w-2.5 h-2.5 mr-0.5" /> Hold
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => onDelete(item.id)}>
                    <Trash2 className="w-2.5 h-2.5 mr-0.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
          ))}

          {onHoldItems.length > 0 && (
            <>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide pt-1">
                On Hold
              </div>
              {onHoldItems.map(item => (
                <div key={item.id} className="rounded-md bg-muted/30 border border-border p-2">
                  <div className="flex items-start gap-1.5">
                    <Pause className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground">{item.text}</span>
                      {item.notes && <div className="text-[10px] text-muted-foreground italic mt-0.5">"{item.notes}"</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => startReschedule(item)}>
                      <CalendarClock className="w-2.5 h-2.5 mr-0.5" /> Reschedule
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => onDelete(item.id)}>
                      <Trash2 className="w-2.5 h-2.5 mr-0.5" /> Delete
                    </Button>
                  </div>
                  {rescheduleId === item.id && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-7 text-xs flex-1" />
                      <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-7 text-xs w-20" />
                      <Button size="sm" className="h-7 text-xs" onClick={confirmReschedule}>OK</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setRescheduleId(null)}>Cancel</Button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}