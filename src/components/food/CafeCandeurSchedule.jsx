import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, Users, Trash2 } from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
  parseISO, isSameDay, getMonth, getDay, addDays
} from 'date-fns';

// May = 4, August = 7 (0-indexed)
const SUMMER_MONTHS = [4, 5, 6, 7];
const SHIFT_START = '08:00';
const SHIFT_END = '15:30';

function isSummerMonth(date) {
  return SUMMER_MONTHS.includes(getMonth(date));
}

function isWeekday(date) {
  const d = getDay(date);
  return d >= 1 && d <= 5;
}

function buildShiftDatetime(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function CafeCandeurSchedule() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [displayMonth, setDisplayMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({
    title: 'Cafe Candeur Shift',
    assigned_staff: [],
    assigned_volunteers: [],
    internal_placement: false,
    placement_participant: '',
    notes: '',
  });

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    .filter(d => isWeekday(d));

  // Jump to first week of a given month (month nav is independent from week nav)
  const goToMonth = (offset) => {
    setDisplayMonth(m => new Date(m.getFullYear(), m.getMonth() + offset, 1));
    setWeekStart(prev => {
      // Only jump the week if it's not already in the target month
      const targetMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + offset, 1);
      const weekInTarget = prev >= targetMonth && prev < new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);
      if (weekInTarget) return prev;
      return startOfWeek(targetMonth, { weekStartsOn: 1 });
    });
  };

  const { data: schedules = [] } = useQuery({
    queryKey: ['food-schedules'],
    queryFn: () => base44.entities.FoodServiceSchedule.list('-start_datetime'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['food-employees'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['food-volunteers'],
    queryFn: () => base44.entities.Volunteer.filter({ status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodServiceSchedule.create(data),
    onSuccess: () => { qc.invalidateQueries(['food-schedules']); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodServiceSchedule.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['food-schedules']); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FoodServiceSchedule.delete(id),
    onSuccess: () => { qc.invalidateQueries(['food-schedules']); setDialogOpen(false); setEditing(null); },
  });

  // Get cafe-candeur shifts for a given date
  const getShiftsForDay = (date) => {
    return schedules.filter(s => {
      if (s.area !== 'cafe-candeur') return false;
      return isSameDay(parseISO(s.start_datetime), date);
    });
  };

  const openNew = (date) => {
    setSelectedDate(date);
    setEditing(null);
    setForm({
      title: 'Cafe Candeur Shift',
      assigned_staff: [],
      assigned_volunteers: [],
      internal_placement: false,
      placement_participant: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (shift) => {
    setEditing(shift);
    setSelectedDate(parseISO(shift.start_datetime));
    setForm({
      title: shift.title,
      assigned_staff: shift.assigned_staff || [],
      assigned_volunteers: shift.assigned_volunteers || [],
      internal_placement: shift.internal_placement || false,
      placement_participant: shift.placement_participant || '',
      notes: shift.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      title: form.title,
      area: 'cafe-candeur',
      event_type: 'shift',
      start_datetime: buildShiftDatetime(selectedDate, SHIFT_START),
      end_datetime: buildShiftDatetime(selectedDate, SHIFT_END),
      assigned_staff: form.assigned_staff,
      assigned_volunteers: form.assigned_volunteers,
      internal_placement: form.internal_placement,
      placement_participant: form.placement_participant,
      notes: form.notes,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSummer = weekDays.some(d => isSummerMonth(d));
  const totalAssigned = (s) => (s.assigned_staff?.length || 0) + (s.assigned_volunteers?.length || 0) + (s.internal_placement ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-heading">Cafe Candeur Shift Schedule</h3>
          <p className="text-sm text-muted-foreground">Mon–Fri, 8:00 AM – 3:30 PM • Closed May through August</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => goToMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[120px] text-center">
              {format(displayMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => goToMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[160px] text-center">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 4), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              This Week
            </Button>
          </div>
        </div>
      </div>

      {/* Summer closure banner */}
      {isSummer && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Cafe Candeur is closed May through August. No shifts are scheduled during this period.</span>
        </div>
      )}

      {/* Week grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 divide-x">
            {weekDays.map(day => {
              const closed = isSummerMonth(day);
              const shifts = getShiftsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className={`min-h-[200px] flex flex-col ${closed ? 'bg-amber-50/60' : ''}`}>
                  {/* Day header */}
                  <div className={`px-3 py-2 border-b text-center ${isToday ? 'bg-primary/10' : 'bg-muted/30'}`}>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    {!closed && (
                      <div className="text-[10px] text-muted-foreground">8:00–3:30</div>
                    )}
                  </div>

                  {/* Day content */}
                  <div className="flex-1 p-2 space-y-1.5">
                    {closed && (
                      <div className="text-center pt-1 pb-1 text-[9px] text-amber-600 font-medium italic">Typically closed</div>
                    )}
                    {shifts.map(shift => (
                      <div
                        key={shift.id}
                        onClick={() => openEdit(shift)}
                        className="p-2 rounded-md bg-amber-100 border border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors"
                      >
                        <div className="text-xs font-semibold text-amber-800 truncate">{shift.title}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(shift.assigned_staff?.length || 0) > 0 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              {shift.assigned_staff.length} staff
                            </span>
                          )}
                          {(shift.assigned_volunteers?.length || 0) > 0 && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              {shift.assigned_volunteers.length} vol
                            </span>
                          )}
                          {shift.internal_placement && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                              placement
                            </span>
                          )}
                          {totalAssigned(shift) === 0 && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                              unassigned
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => openNew(day)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded p-1 flex items-center justify-center gap-1 transition-colors border border-dashed border-border"
                    >
                      <Plus className="w-3 h-3" /> Add CSJ Catering Event
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit CSJ Catering Event' : 'Add CSJ Catering Event'} — {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              Shift time: <strong>8:00 AM – 3:30 PM</strong> (Cafe Candeur standard hours)
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Shift Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Staff */}
            <div>
              <label className="text-sm font-medium mb-2 block text-blue-700">
                Staff Members ({form.assigned_staff.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                {employees.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active employees found</p>
                ) : employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-50 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={form.assigned_staff.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) setForm(f => ({ ...f, assigned_staff: [...f.assigned_staff, emp.id] }));
                        else setForm(f => ({ ...f, assigned_staff: f.assigned_staff.filter(id => id !== emp.id) }));
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium leading-tight">{emp.first_name} {emp.last_name}</div>
                      <div className="text-[10px] text-muted-foreground">{emp.position}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Volunteers */}
            <div>
              <label className="text-sm font-medium mb-2 block text-green-700">
                Volunteers ({form.assigned_volunteers.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                {volunteers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active volunteers found</p>
                ) : volunteers.map(vol => (
                  <label key={vol.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-green-50 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={form.assigned_volunteers.includes(vol.id)}
                      onChange={(e) => {
                        if (e.target.checked) setForm(f => ({ ...f, assigned_volunteers: [...f.assigned_volunteers, vol.id] }));
                        else setForm(f => ({ ...f, assigned_volunteers: f.assigned_volunteers.filter(id => id !== vol.id) }));
                      }}
                      className="w-4 h-4"
                    />
                    <div className="font-medium">{vol.first_name} {vol.last_name}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Internal Placement */}
            <div className="border-t pt-3">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.internal_placement}
                  onChange={(e) => setForm(f => ({ ...f, internal_placement: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-purple-700">Internal Placement (Pathways participant)</span>
              </label>
              {form.internal_placement && (
                <Input
                  value={form.placement_participant}
                  onChange={(e) => setForm(f => ({ ...f, placement_participant: e.target.value }))}
                  placeholder="Participant name"
                  className="ml-6"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px] bg-background"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-between pt-1">
              {editing && (
                <Button variant="outline" className="text-destructive" onClick={() => deleteMutation.mutate(editing.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.title}>
                  {editing ? 'Save Changes' : 'Create Shift'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}