import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import CafeCandeurSchedule from '@/components/food/CafeCandeurSchedule';

const AREA_COLORS = {
  'catering': 'bg-blue-100 text-blue-700 border-blue-300',
  'cafe-candeur': 'bg-amber-100 text-amber-700 border-amber-300',
  'auntie-bevs': 'bg-pink-100 text-pink-700 border-pink-300',
  'community-lunch': 'bg-orange-100 text-orange-700 border-orange-300',
  'food-production': 'bg-green-100 text-green-700 border-green-300',
  'general': 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function FoodSchedule() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  
  // Derive filter directly from URL param (reactive)
  const urlArea = searchParams.get('area');
  const [manualFilter, setManualFilter] = useState(null);
  const areaFilter = manualFilter || urlArea || 'all';
  const setAreaFilter = (val) => setManualFilter(val === (urlArea || 'all') ? null : val);
  const [form, setForm] = useState({
    title: '',
    description: '',
    area: 'general',
    event_type: 'shift',
    start_datetime: '',
    end_datetime: '',
    location: '',
    notes: '',
    internal_placement: false,
    placement_participant: '',
    assigned_staff: [],
    assigned_volunteers: [],
    recurring: false,
    recurring_pattern: 'weekly',
    recurring_end_date: '',
  });

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

  const createSchedule = useMutation({
    mutationFn: (data) => base44.entities.FoodServiceSchedule.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['food-schedules']);
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateSchedule = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodServiceSchedule.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['food-schedules']);
      setDialogOpen(false);
      setEditing(null);
      resetForm();
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: (id) => base44.entities.FoodServiceSchedule.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['food-schedules']);
      setDialogOpen(false);
      setEditing(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      area: 'general',
      event_type: 'shift',
      start_datetime: '',
      end_datetime: '',
      location: '',
      notes: '',
      internal_placement: false,
      placement_participant: '',
      assigned_staff: [],
      assigned_volunteers: [],
      recurring: false,
      recurring_pattern: 'weekly',
      recurring_end_date: '',
    });
  };

  const filteredSchedules = schedules.filter(s => areaFilter === 'all' || s.area === areaFilter);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Get the proper start of week (Sunday) for the first week
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDate = (date) => {
    return filteredSchedules.filter(s => {
      const startDate = parseISO(s.start_datetime);
      const endDate = parseISO(s.end_datetime);
      // Check if date falls within the event's start and end (inclusive)
      return (
        (isSameDay(startDate, date) || date > startDate) &&
        (isSameDay(endDate, date) || date < endDate || isSameDay(endDate, date))
      );
    });
  };

  // Get all staff/assignments for personnel view
  const personnelData = filteredSchedules.filter(s => 
    s.event_type === 'shift' || s.event_type === 'internal_placement'
  );

  const handleSave = () => {
    const basePayload = {
      title: form.title,
      description: form.description,
      area: form.area,
      event_type: form.event_type,
      location: form.location,
      notes: form.notes,
      internal_placement: form.internal_placement,
      placement_participant: form.placement_participant,
      assigned_staff: form.assigned_staff,
      assigned_volunteers: form.assigned_volunteers,
    };

    if (editing) {
      const payload = {
        ...basePayload,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
      };
      updateSchedule.mutate({ id: editing.id, data: payload });
    } else if (form.recurring && form.recurring_end_date) {
      // Create multiple recurring events
      const startDate = new Date(form.start_datetime);
      const endDate = new Date(form.end_datetime);
      const endDateTime = new Date(form.recurring_end_date);
      const durationMs = endDate - startDate;
      
      const eventsToCreate = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDateTime) {
        const eventStart = new Date(currentDate);
        const eventEnd = new Date(eventStart.getTime() + durationMs);
        
        eventsToCreate.push({
          ...basePayload,
          start_datetime: eventStart.toISOString(),
          end_datetime: eventEnd.toISOString(),
          recurring: true,
          recurring_pattern: form.recurring_pattern,
        });
        
        // Move to next occurrence based on pattern
        switch (form.recurring_pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 7);
        }
      }
      
      // Create all events
      Promise.all(eventsToCreate.map(event => base44.entities.FoodServiceSchedule.create(event)))
        .then(() => {
          qc.invalidateQueries(['food-schedules']);
          setDialogOpen(false);
          resetForm();
        });
    } else {
      const payload = {
        ...basePayload,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
      };
      createSchedule.mutate(payload);
    }
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      area: item.area,
      event_type: item.event_type,
      start_datetime: item.start_datetime.slice(0, 16),
      end_datetime: item.end_datetime.slice(0, 16),
      location: item.location || '',
      notes: item.notes || '',
      internal_placement: item.internal_placement || false,
      placement_participant: item.placement_participant || '',
      assigned_staff: item.assigned_staff || [],
      assigned_volunteers: item.assigned_volunteers || [],
      recurring: item.recurring || false,
      recurring_pattern: item.recurring_pattern || 'weekly',
      recurring_end_date: item.recurring_end_date || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-heading">
              {areaFilter !== 'all' ? (
                <>
                  {areaFilter === 'catering' && 'Catering'}
                  {areaFilter === 'cafe-candeur' && 'Cafe Candeur'}
                  {areaFilter === 'auntie-bevs' && "Auntie Bev's"}
                  {areaFilter === 'community-lunch' && 'Community Lunch'}
                  {areaFilter === 'food-production' && 'Food Production'}
                  {areaFilter === 'general' && 'General'} Schedule
                </>
              ) : (
                'Food Services Schedule'
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {areaFilter !== 'all' ? `Viewing ${areaFilter.replace('-', ' ')} only` : 'Manage all food service events, bookings, and staffing'}
            </p>
          </div>
          {areaFilter !== 'cafe-candeur' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {areaFilter !== 'cafe-candeur' && (
            <Button
              variant={areaFilter !== 'all' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setAreaFilter('all')}
              className={areaFilter === 'all' ? 'bg-primary text-primary-foreground' : ''}
            >
              All Areas
            </Button>
          )}
          {areaFilter !== 'cafe-candeur' && (
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Cafe Candeur dedicated scheduler */}
      {areaFilter === 'cafe-candeur' && <CafeCandeurSchedule />}

      {/* Tabs — shown for all areas except cafe-candeur which has its own UI above */}
      {areaFilter !== 'cafe-candeur' && (
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'calendar' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shifts' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Shifts & Staffing
        </button>
      </div>
      )}

      {areaFilter !== 'cafe-candeur' && activeTab === 'calendar' && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center font-semibold text-sm border-r bg-muted/50">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const daySchedules = getSchedulesForDate(day);
                const isPaddingDay = !isSameMonth(day, currentMonth);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] p-2 border-r border-b ${isPaddingDay ? 'bg-muted/30' : ''}`}
                  >
                    {!isPaddingDay && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {daySchedules.slice(0, 3).map(schedule => {
                            const startDate = parseISO(schedule.start_datetime);
                            const endDate = parseISO(schedule.end_datetime);
                            const isMultiDay = !isSameDay(startDate, endDate);
                            const isStartDay = isSameDay(startDate, day);
                            const isEndDay = isSameDay(endDate, day);
                            const isMiddleDay = !isStartDay && !isEndDay;

                            return (
                              <div
                                key={schedule.id}
                                className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${AREA_COLORS[schedule.area] || AREA_COLORS.general} ${isMultiDay ? 'opacity-90' : ''}`}
                                onClick={() => openEdit(schedule)}
                              >
                                <div className="font-medium truncate">{schedule.title}</div>
                                <div className="text-[10px] opacity-80">
                                  {isMultiDay ? (
                                    isStartDay ? (
                                      <>Starts {format(startDate, 'h:mm a')}</>
                                    ) : isEndDay ? (
                                      <>Ends {format(endDate, 'h:mm a')}</>
                                    ) : (
                                      <>Day {format(day, 'MMM d')}</>
                                    )
                                  ) : (
                                    format(startDate, 'h:mm a')
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {daySchedules.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                              +{daySchedules.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {areaFilter !== 'cafe-candeur' && activeTab === 'shifts' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-heading mb-3">Shifts & Staffing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on a shift to add/remove staff, volunteers, and placements
                </p>
              </div>

              {/* List of shifts */}
              <div className="grid gap-3">
                {personnelData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No shifts created yet. Create events in the Calendar tab.</p>
                  </div>
                ) : (
                  personnelData
                    .sort((a, b) => parseISO(a.start_datetime) - parseISO(b.start_datetime))
                    .map(shift => {
                      const staffCount = shift.assigned_staff?.length || 0;
                      const volunteerCount = shift.assigned_volunteers?.length || 0;
                      const hasPlacement = shift.internal_placement;
                      const totalAssigned = staffCount + volunteerCount + (hasPlacement ? 1 : 0);

                      return (
                        <div
                          key={shift.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedShiftId === shift.id ? 'border-primary ring-2 ring-primary/20' : ''
                          } ${AREA_COLORS[shift.area]}`}
                          onClick={() => setSelectedShiftId(shift.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">{shift.title}</span>
                                <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded">{shift.area}</span>
                              </div>
                              <div className="text-xs opacity-80">
                                {format(parseISO(shift.start_datetime), 'MMM d, h:mm a')} - {format(parseISO(shift.end_datetime), 'h:mm a')}
                                {shift.location && ` • ${shift.location}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {staffCount > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {staffCount} staff
                                </span>
                              )}
                              {volunteerCount > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {volunteerCount} volunteers
                                </span>
                              )}
                              {hasPlacement && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  Placement
                                </span>
                              )}
                              {totalAssigned === 0 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                  No one assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Shift Detail Panel */}
              {selectedShiftId && (
                <div className="border-t pt-6 mt-4">
                  {(() => {
                    const shift = personnelData.find(s => s.id === selectedShiftId);
                    if (!shift) return null;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg">{shift.title}</h4>
                          <Button variant="outline" size="sm" onClick={() => openEdit(shift)}>
                            Edit Shift Details
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(shift.start_datetime), 'EEEE, MMMM d, yyyy')} • {format(parseISO(shift.start_datetime), 'h:mm a')} - {format(parseISO(shift.end_datetime), 'h:mm a')}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Staff Column */}
                          <div className="border rounded-lg p-4 bg-blue-50/50">
                            <h5 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">S</span>
                              Staff ({shift.assigned_staff?.length || 0})
                            </h5>
                            <div className="space-y-2">
                              {shift.assigned_staff?.map(staffId => {
                                const emp = employees.find(e => e.id === staffId);
                                if (!emp) return null;
                                return (
                                  <div key={staffId} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                                    <div>
                                      <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                                      <div className="text-xs text-muted-foreground">{emp.position}</div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSchedule.mutate({
                                          id: shift.id,
                                          data: {
                                            ...shift,
                                            assigned_staff: shift.assigned_staff.filter(id => id !== staffId)
                                          }
                                        });
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                );
                              })}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                  const empId = prompt('Enter employee ID to add:');
                                  if (empId) {
                                    updateSchedule.mutate({
                                      id: shift.id,
                                      data: {
                                        ...shift,
                                        assigned_staff: [...(shift.assigned_staff || []), empId]
                                      }
                                    });
                                  }
                                }}
                              >
                                + Add Staff
                              </Button>
                            </div>
                          </div>

                          {/* Volunteers Column */}
                          <div className="border rounded-lg p-4 bg-green-50/50">
                            <h5 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">V</span>
                              Volunteers ({shift.assigned_volunteers?.length || 0})
                            </h5>
                            <div className="space-y-2">
                              {shift.assigned_volunteers?.map(volId => {
                                const vol = volunteers.find(v => v.id === volId);
                                if (!vol) return null;
                                return (
                                  <div key={volId} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                                    <div>
                                      <div className="font-medium">{vol.first_name} {vol.last_name}</div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSchedule.mutate({
                                          id: shift.id,
                                          data: {
                                            ...shift,
                                            assigned_volunteers: shift.assigned_volunteers.filter(id => id !== volId)
                                          }
                                        });
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                );
                              })}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                  const volId = prompt('Enter volunteer ID to add:');
                                  if (volId) {
                                    updateSchedule.mutate({
                                      id: shift.id,
                                      data: {
                                        ...shift,
                                        assigned_volunteers: [...(shift.assigned_volunteers || []), volId]
                                      }
                                    });
                                  }
                                }}
                              >
                                + Add Volunteer
                              </Button>
                            </div>
                          </div>

                          {/* Placements Column */}
                          <div className="border rounded-lg p-4 bg-purple-50/50">
                            <h5 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">P</span>
                              Internal Placement
                            </h5>
                            {shift.internal_placement ? (
                              <div className="space-y-2">
                                <div className="text-sm p-2 bg-white rounded border">
                                  <div className="font-medium">{shift.placement_participant || 'TBD'}</div>
                                  <div className="text-xs text-muted-foreground">Pathways participant</div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => {
                                    updateSchedule.mutate({
                                      id: shift.id,
                                      data: {
                                        ...shift,
                                        internal_placement: false,
                                        placement_participant: ''
                                      }
                                    });
                                  }}
                                >
                                  Remove Placement
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Mark this shift as an internal placement for a Pathways participant</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    const name = prompt('Enter participant name:');
                                    if (name) {
                                      updateSchedule.mutate({
                                        id: shift.id,
                                        data: {
                                          ...shift,
                                          internal_placement: true,
                                          placement_participant: name
                                        }
                                      });
                                    }
                                  }}
                                >
                                  + Add Placement
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Schedule Item' : 'New Schedule Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Morning Shift, Catering Event"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Area *</label>
                <select
                  value={form.area}
                  onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="catering">Catering</option>
                  <option value="cafe-candeur">Cafe Candeur</option>
                  <option value="auntie-bevs">Auntie Bev's</option>
                  <option value="community-lunch">Community Lunch</option>
                  <option value="food-production">Food Production</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Event Type</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="shift">Staff Shift</option>
                <option value="production">Food Production</option>
                <option value="catering_event">Catering Event</option>
                <option value="service">Service Period</option>
                <option value="prep">Preparation</option>
                <option value="cleanup">Cleanup</option>
                <option value="meeting">Meeting</option>
                <option value="internal_placement">Internal Placement</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date/Time *</label>
                <Input
                  type="datetime-local"
                  value={form.start_datetime}
                  onChange={(e) => setForm(f => ({ ...f, start_datetime: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date/Time *</label>
                <Input
                  type="datetime-local"
                  value={form.end_datetime}
                  onChange={(e) => setForm(f => ({ ...f, end_datetime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                value={form.location}
                onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g., Main Kitchen, Boardroom, Cafe Floor"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-sm mb-1 text-blue-800">💡 How to Schedule People:</h4>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Fill in the shift details above (title, time, location)</li>
                <li>Scroll down to "Who's Working This Shift?"</li>
                <li>Check the boxes for staff and/or volunteers working</li>
                <li>OR check "Internal Placement" for Pathways participants</li>
                <li>Click Create to save</li>
              </ol>
            </div>

            {/* WHO'S WORKING SECTION - Always visible for shifts */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <span>👥</span> Who's Working This Shift?
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Select staff, volunteers, or mark as internal placement
              </p>

              {/* Staff Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block text-blue-700">
                  🟦 Staff Members ({form.assigned_staff.length} selected)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                  {employees.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active employees found</p>
                  ) : (
                    employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={form.assigned_staff.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, assigned_staff: [...f.assigned_staff, emp.id] }));
                            } else {
                              setForm(f => ({ ...f, assigned_staff: f.assigned_staff.filter(id => id !== emp.id) }));
                            }
                          }}
                          className="w-4 h-4 rounded border-blue-300 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                          <div className="text-xs text-muted-foreground">{emp.position}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Volunteer Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block text-green-700">
                  🟩 Volunteers ({form.assigned_volunteers.length} selected)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                  {volunteers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active volunteers found</p>
                  ) : (
                    volunteers.map(vol => (
                      <label key={vol.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-green-50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={form.assigned_volunteers.includes(vol.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, assigned_volunteers: [...f.assigned_volunteers, vol.id] }));
                            } else {
                              setForm(f => ({ ...f, assigned_volunteers: f.assigned_volunteers.filter(id => id !== vol.id) }));
                            }
                          }}
                          className="w-4 h-4 rounded border-green-300 text-green-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{vol.first_name} {vol.last_name}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Internal Placement Option */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={form.internal_placement}
                    onChange={(e) => setForm(f => ({ ...f, internal_placement: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-purple-700">🟪 This is an Internal Placement (Pathways participant)</span>
                </label>
                {form.internal_placement && (
                  <div className="mt-2 ml-6">
                    <label className="text-sm font-medium mb-1 block">Participant Name *</label>
                    <Input
                      value={form.placement_participant}
                      onChange={(e) => setForm(f => ({ ...f, placement_participant: e.target.value }))}
                      placeholder="e.g., John Smith (Pathways client)"
                      className="border-purple-300 focus:border-purple-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For Pathways program participants doing placements
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Summary */}
              {(form.assigned_staff.length > 0 || form.assigned_volunteers.length > 0 || form.internal_placement) && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm font-medium mb-2">Summary:</div>
                  <div className="flex flex-wrap gap-2">
                    {form.assigned_staff.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {form.assigned_staff.length} staff member{form.assigned_staff.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {form.assigned_volunteers.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {form.assigned_volunteers.length} volunteer{form.assigned_volunteers.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {form.internal_placement && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Placement: {form.placement_participant || 'TBD'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Event Section */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <span>🔄</span> Recurring Event
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Make this event repeat automatically
              </p>

              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm(f => ({ ...f, recurring: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">This is a recurring event</span>
              </label>

              {form.recurring && (
                <div className="space-y-4 ml-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Repeat Pattern *</label>
                    <select
                      value={form.recurring_pattern}
                      onChange={(e) => setForm(f => ({ ...f, recurring_pattern: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 Weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">End Date *</label>
                    <Input
                      type="date"
                      value={form.recurring_end_date}
                      onChange={(e) => setForm(f => ({ ...f, recurring_end_date: e.target.value }))}
                      min={form.start_datetime?.split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Events will repeat until this date
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="text-xs text-amber-800">
                      <strong>Preview:</strong> This will create {form.recurring_pattern === 'daily' ? 'daily' : form.recurring_pattern === 'weekly' ? 'weekly' : form.recurring_pattern === 'biweekly' ? 'bi-weekly' : 'monthly'} events starting from {form.start_datetime ? format(parseISO(form.start_datetime), 'MMM d') : 'the start date'} until {form.recurring_end_date ? format(parseISO(form.recurring_end_date), 'MMM d, yyyy') : 'the end date'}.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex justify-end gap-2">
              {editing && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => deleteSchedule.mutate(editing.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.title || !form.start_datetime || !form.end_datetime}>
                {editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}