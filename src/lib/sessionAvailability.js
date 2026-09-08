import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ---- time helpers ----
export const timeToMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const DAY_MS = 86400000;
const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Fallback room detection from free-text location (mirrors the calendar)
export const locationRoom = (location) => {
  const loc = (location || '').toLowerCase();
  if (loc.includes('large classroom')) return 'large_classroom';
  if (loc.includes('small classroom')) return 'small_classroom';
  if (loc.includes('employment')) return 'employment_classroom';
  if (loc.includes('echo valley')) return 'echo_valley';
  return '';
};

// Does a (possibly recurring) record occur on dateISO?
function occursOn(record, dateISO, baseDateStr) {
  const base = parseLocalDate(baseDateStr);
  const target = parseLocalDate(dateISO);
  if (!base || !target) return false;
  const pattern = record.recurrence_pattern;
  if (!pattern || pattern === 'none') return dayKey(base) === dateISO;
  const limit = record.recurrence_end_date ? parseLocalDate(record.recurrence_end_date) : null;
  if (limit && target > limit) return false;
  const diffDays = Math.round((target - base) / DAY_MS);
  if (diffDays < 0) return false;
  if (pattern === 'weekly') return diffDays % 7 === 0;
  if (pattern === 'biweekly') return diffDays % 14 === 0;
  if (pattern === 'monthly') return base.getDate() === target.getDate();
  return false;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Fetches every session source that books a room (all portals) and returns the
 * bookings for one date: [{ id, source, title, room, start, end }] with HH:MM
 * times. Powers the time-slot picker's double-booking prevention.
 */
export function useDayBookings(dateISO, enabled = true) {
  const on = enabled && !!dateISO;
  const workshopsQ = useQuery({ queryKey: ['avail-workshops'], queryFn: () => base44.entities.Workshop.list(), enabled: on });
  const communityQ = useQuery({ queryKey: ['avail-community-sessions'], queryFn: () => base44.entities.CommunitySession.list(), enabled: on });
  const phacQ = useQuery({ queryKey: ['avail-phac-sessions'], queryFn: () => base44.entities.PHACSession.list(), enabled: on });
  const digilitQ = useQuery({ queryKey: ['avail-digilit-sessions'], queryFn: () => base44.entities.DigiLitSession.list(), enabled: on });
  const frnQ = useQuery({ queryKey: ['avail-frn-sessions'], queryFn: () => base44.entities.FRNSession.list(), enabled: on });
  const childmindingQ = useQuery({ queryKey: ['avail-childminding-sessions'], queryFn: () => base44.entities.ChildmindingSession.list(), enabled: on });
  const volunteerQ = useQuery({ queryKey: ['avail-volunteer-events'], queryFn: () => base44.entities.VolunteerEvent.list(), enabled: on });
  const ellQ = useQuery({ queryKey: ['avail-ell-classes'], queryFn: () => base44.entities.ELLClass.list(), enabled: on });

  return useMemo(() => {
    if (!dateISO) return { bookings: [], isLoading: false };
    const out = [];
    const push = (rec, source, title, start, end, location, room) => {
      if (!start || !end) return; // without times a record can't block a slot
      out.push({ id: rec.id, source, title, start, end, room: room || locationRoom(location) || '' });
    };
    const recBookings = (records, source, titleFn, dateField) => {
      (records || []).filter(r => r.status !== 'cancelled').forEach(r => {
        const baseStr = r[dateField] || r.session_date || r.date;
        if (!occursOn(r, dateISO, baseStr)) return;
        push(r, source, titleFn(r), r.start_time, r.end_time, r.location, r.room);
      });
    };
    recBookings(workshopsQ.data, 'pathways', w => w.title, 'date');
    recBookings(communityQ.data, 'community', s => s.title || s.program_name || 'Community Session', 'session_date');
    recBookings(phacQ.data, 'phac', s => s.program_name || 'PHAC Session', 'session_date');
    recBookings(digilitQ.data, 'digilit', s => s.title || 'Digital Literacy Session', 'session_date');
    recBookings(frnQ.data, 'frn', s => s.program_name || 'FRN Session', 'session_date');
    recBookings(childmindingQ.data, 'childminding', s => s.title || 'Childminding', 'session_date');
    recBookings(volunteerQ.data, 'volunteer', s => s.title || 'Volunteer Event', 'session_date');

    // ELL classes — weekly schedule_days between start/end dates
    const d = parseLocalDate(dateISO);
    if (d) {
      const dayName = WEEKDAYS[d.getDay()];
      (ellQ.data || []).filter(c => c.status === 'active' && (c.schedule_days || []).includes(dayName)).forEach(c => {
        if (c.start_date && dateISO < c.start_date) return;
        if (c.end_date && dateISO > c.end_date) return;
        push(c, 'ell', c.name, c.start_time, c.end_time, c.location, c.room);
      });
    }

    const isLoading = [workshopsQ, communityQ, phacQ, digilitQ, frnQ, childmindingQ, volunteerQ, ellQ].some(q => q.isLoading);
    return { bookings: out, isLoading };
  }, [dateISO, workshopsQ.data, communityQ.data, phacQ.data, digilitQ.data, frnQ.data, childmindingQ.data, volunteerQ.data, ellQ.data, workshopsQ.isLoading, communityQ.isLoading, phacQ.isLoading, digilitQ.isLoading, frnQ.isLoading, childmindingQ.isLoading, volunteerQ.isLoading, ellQ.isLoading]);
}