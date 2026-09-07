import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { BookOpen, GraduationCap, Clock, MapPin, Users, User as UserIcon, CalendarRange, Snowflake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CourseLessonPlansDialog from '@/components/ell/CourseLessonPlansDialog';
import { ROOM_OPTIONS } from '@/lib/centralRegConstants';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const CLB_LABELS = {
  clb_1: 'CLB 1', clb_2: 'CLB 2', clb_3: 'CLB 3', clb_4: 'CLB 4', clb_5: 'CLB 5',
  clb_6: 'CLB 6', clb_7: 'CLB 7', clb_8: 'CLB 8', clb_9: 'CLB 9', clb_10: 'CLB 10',
  clb_11: 'CLB 11', clb_12: 'CLB 12', mixed: 'Mixed levels', not_assessed: 'Not assessed',
};

// Course profile enrichment — Adult Learning Centre Classroom Calendar 2026–2027
const COURSE_PROFILES = {
  'Beginner': {
    color: '#7c3aed',
    tagline: 'Foundation English for new learners',
    order: 1,
  },
  'Basic 1': {
    color: '#ea580c',
    tagline: 'Continuing beginner — everyday reading, writing & speaking',
    order: 2,
  },
  'Basic 2': {
    color: '#ca8a04',
    tagline: 'Second-level basics — expanding grammar & vocabulary',
    order: 3,
  },
  'Intermediate': {
    color: '#16a34a',
    tagline: 'Refining fluency and confidence for daily life and work',
    order: 4,
  },
  'Employment Literacy': {
    color: '#0284c7',
    tagline: 'Job-focused English delivered in three sessions across the year',
    order: 5,
    sessions: [
      { label: 'Session 1', start: '2026-09-21', end: '2026-12-01' },
      { label: 'Session 2', start: '2027-01-04', end: '2027-03-09' },
      { label: 'Session 3', start: '2027-04-05', end: '2027-06-08' },
    ],
  },
};

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (str) => {
  const d = parseLocalDate(str);
  return d ? format(d, 'MMM d, yyyy') : '';
};

const roomLabel = (cls) => {
  const r = ROOM_OPTIONS.find(o => o.value === cls.room);
  return r ? r.label : (cls.location || 'Room TBC');
};

function CourseProfileCard({ cls, enrolled, onManagePlans }) {
  const profile = COURSE_PROFILES[cls.name] || {};
  const color = profile.color || '#7c3aed';
  const days = (DAY_ORDER.filter(d => (cls.schedule_days || []).includes(d))).map(d => DAY_LABELS[d]).join(' / ');
  return (
    <Card className="overflow-hidden border-t-4" style={{ borderTopColor: color }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg" style={{ color }}>{cls.name}</h3>
            {profile.tagline && <p className="text-sm text-muted-foreground">{profile.tagline}</p>}
          </div>
          {cls.clb_level && (
            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}10` }}>
              {CLB_LABELS[cls.clb_level] || cls.clb_level}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {days && <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" />{days}</span>}
          {(cls.start_time || cls.end_time) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{fmtTime(cls.start_time)}{cls.start_time && cls.end_time ? '–' : ''}{fmtTime(cls.end_time)}
            </span>
          )}
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{roomLabel(cls)}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />{enrolled} / {cls.capacity || 15} enrolled
          </span>
          {cls.instructor_name && <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{cls.instructor_name}</span>}
        </div>

        {(cls.start_date || cls.end_date) && (
          <p className="text-xs font-medium text-foreground">
            Program dates: {fmtDate(cls.start_date)}{cls.start_date && cls.end_date ? ' – ' : ''}{fmtDate(cls.end_date)}
          </p>
        )}

        {profile.sessions && (
          <div className="flex flex-wrap gap-2">
            {profile.sessions.map(s => (
              <span key={s.label} className="text-[11px] px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
                {s.label}: {fmtDate(s.start)} – {fmtDate(s.end)}
              </span>
            ))}
          </div>
        )}

        {cls.description && <p className="text-sm text-muted-foreground leading-relaxed">{cls.description}</p>}

        <Button variant="outline" size="sm" className="w-full" onClick={onManagePlans}>
          <BookOpen className="h-4 w-4 mr-2" />
          Lesson Plans ({(cls.lesson_plans || []).length})
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ELLCourses() {
  const [plansCourse, setPlansCourse] = useState(null);
  const classesQ = useQuery({ queryKey: ['ell-courses-classes'], queryFn: () => base44.entities.ELLClass.list() });
  const learnersQ = useQuery({ queryKey: ['ell-courses-learners'], queryFn: () => base44.entities.ELLLearner.list() });

  const classes = (classesQ.data || []).filter(c => c.status !== 'cancelled');
  const sorted = [...classes].sort((a, b) =>
    ((COURSE_PROFILES[a.name]?.order ?? 99) - (COURSE_PROFILES[b.name]?.order ?? 99)) || (a.name || '').localeCompare(b.name || '')
  );
  const enrolledByClass = {};
  (learnersQ.data || []).forEach(l => {
    if (l.assigned_class_id) enrolledByClass[l.assigned_class_id] = (enrolledByClass[l.assigned_class_id] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Course Profiles</h1>
        <p className="text-sm text-muted-foreground">Adult Learning Centre Classroom Calendar 2026–2027</p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">ELL Graduation</p>
            <p className="text-sm text-muted-foreground">Friday, June 18, 2027</p>
          </div>
        </CardContent>
      </Card>

      {classesQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ELL courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map(cls => (
            <CourseProfileCard key={cls.id} cls={cls} enrolled={enrolledByClass[cls.id] || 0} onManagePlans={() => setPlansCourse(cls)} />
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Snowflake className="h-3.5 w-3.5" />
        Winter break note: last teaching day before winter break is December 15/17, as applicable.
      </p>

      {plansCourse && <CourseLessonPlansDialog course={plansCourse} onClose={() => setPlansCourse(null)} />}
    </div>
  );
}