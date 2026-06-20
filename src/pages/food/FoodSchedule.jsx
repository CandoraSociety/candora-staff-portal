import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Auto-filter by area from URL param if present
  const urlArea = searchParams.get('area');
  const [areaFilter, setAreaFilter] = useState(urlArea || 'all');
  
  // Update filter when URL param changes
  useEffect(() => {
    if (urlArea) setAreaFilter(urlArea);
  }, [urlArea]);
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
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['food-schedules'],
    queryFn: () => base44.entities.FoodServiceSchedule.list('-start_datetime'),
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
    });
  };

  const filteredSchedules = schedules.filter(s => areaFilter === 'all' || s.area === areaFilter);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSchedulesForDate = (date) => {
    return filteredSchedules.filter(s => isSameDay(parseISO(s.start_datetime), date));
  };

  const handleSave = () => {
    const payload = {
      ...form,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: new Date(form.end_datetime).toISOString(),
    };

    if (editing) {
      updateSchedule.mutate({ id: editing.id, data: payload });
    } else {
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={areaFilter !== 'all' ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setAreaFilter('all')}
            className={areaFilter === 'all' ? 'bg-primary text-primary-foreground' : ''}
          >
            All Areas
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </div>
      </div>

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
            {days.map(day => {
              const daySchedules = getSchedulesForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2 border-r border-b ${!isSameMonth(day, currentMonth) ? 'bg-muted/30' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map(schedule => (
                      <div
                        key={schedule.id}
                        className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${AREA_COLORS[schedule.area] || AREA_COLORS.general}`}
                        onClick={() => openEdit(schedule)}
                      >
                        <div className="font-medium truncate">{schedule.title}</div>
                        <div className="text-[10px] opacity-80">
                          {format(parseISO(schedule.start_datetime), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">
                        +{daySchedules.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                placeholder="e.g., Main Kitchen, Boardroom"
              />
            </div>

            {form.event_type === 'internal_placement' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Placement Participant Name</label>
                <Input
                  value={form.placement_participant}
                  onChange={(e) => setForm(f => ({ ...f, placement_participant: e.target.value }))}
                  placeholder="Person's name"
                />
              </div>
            )}

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