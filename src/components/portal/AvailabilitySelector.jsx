import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
];

export default function AvailabilitySelector({ value, onChange, showBlockedDates = true }) {
  const [weeklySchedule, setWeeklySchedule] = useState(value?.weekly_schedule || {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  const [blockedDates, setBlockedDates] = useState(value?.blocked_dates || []);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Sync with parent value changes
  useEffect(() => {
    if (value?.weekly_schedule) setWeeklySchedule(value.weekly_schedule);
    if (value?.blocked_dates) setBlockedDates(value.blocked_dates);
  }, [value]);

  const toggleTimeSlot = (day, time) => {
    const daySlots = weeklySchedule[day] || [];
    const newSlots = daySlots.includes(time)
      ? daySlots.filter(t => t !== time)
      : [...daySlots, time];
    
    const newSchedule = { ...weeklySchedule, [day]: newSlots };
    setWeeklySchedule(newSchedule);
    onChange?.({ weekly_schedule: newSchedule, blocked_dates: blockedDates });
  };

  const handleCalendarSelect = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newBlocked = blockedDates.includes(dateStr)
      ? blockedDates.filter(d => d !== dateStr)
      : [...blockedDates, dateStr];
    setBlockedDates(newBlocked);
    onChange?.({ weekly_schedule: weeklySchedule, blocked_dates: newBlocked });
  };

  const clearAll = () => {
    const empty = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    setWeeklySchedule(empty);
    onChange?.({ weekly_schedule: empty, blocked_dates: blockedDates });
  };

  return (
    <div className="space-y-4">
      {/* Weekly Schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <Label className="font-semibold">Weekly Availability</Label>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
            Clear All
          </Button>
        </div>
        
        <div className="space-y-3">
          {DAYS_OF_WEEK.map(day => (
            <Card key={day.key} className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={(weeklySchedule[day.key] || []).length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedDay(selectedDay === day.key ? null : day.key);
                      if (!checked) {
                        const newSchedule = { ...weeklySchedule, [day.key]: [] };
                        setWeeklySchedule(newSchedule);
                        onChange?.({ weekly_schedule: newSchedule, blocked_dates: blockedDates });
                      }
                    }}
                  />
                  <Label className="font-medium text-sm">{day.label}</Label>
                  {selectedDay === day.key && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(weeklySchedule[day.key] || []).length} slots selected
                    </span>
                  )}
                </div>
                
                {selectedDay === day.key && (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 mt-2 pl-6">
                    {TIME_SLOTS.map(time => (
                      <Button
                        key={time}
                        type="button"
                        variant={weeklySchedule[day.key]?.includes(time) ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-7 text-xs px-2",
                          weeklySchedule[day.key]?.includes(time) && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => toggleTimeSlot(day.key, time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Blocked Dates */}
      {showBlockedDates && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-destructive" />
            <Label className="font-semibold">Blocked Dates (Unavailable)</Label>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {blockedDates.length > 0 ? `${blockedDates.length} blocked` : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  selected={blockedDates.map(d => {
                    const [year, month, day] = d.split('-');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  })}
                  onSelect={(dates) => {
                    if (!dates) {
                      setBlockedDates([]);
                      onChange?.({ weekly_schedule: weeklySchedule, blocked_dates: [] });
                      return;
                    }
                    const newBlocked = dates.map(d => {
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    });
                    setBlockedDates(newBlocked);
                    onChange?.({ weekly_schedule: weeklySchedule, blocked_dates: newBlocked });
                  }}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
            
            {blockedDates.length > 0 && (
              <div className="flex-1 flex flex-wrap gap-1">
                {blockedDates.slice(0, 5).map(date => (
                  <Badge key={date} variant="outline" className="text-xs flex items-center gap-1">
                    {format(new Date(date), 'MMM d')}
                    <button
                      type="button"
                      onClick={() => {
                        const newBlocked = blockedDates.filter(d => d !== date);
                        setBlockedDates(newBlocked);
                        onChange?.({ weekly_schedule: weeklySchedule, blocked_dates: newBlocked });
                      }}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {blockedDates.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{blockedDates.length - 5} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}