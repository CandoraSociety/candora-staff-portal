import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

const CLB_LABELS = {
  clb_1: 'CLB 1', clb_2: 'CLB 2', clb_3: 'CLB 3', clb_4: 'CLB 4', clb_5: 'CLB 5',
  clb_6: 'CLB 6', clb_7: 'CLB 7', clb_8: 'CLB 8', clb_9: 'CLB 9', clb_10: 'CLB 10',
  clb_11: 'CLB 11', clb_12: 'CLB 12', not_assessed: 'Not assessed',
};

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Days a learner has been on the waitlist — falls back to intake/created date
// for learners waitlisted before waitlist_date was tracked.
const daysWaitlisted = (l) => {
  const base = l.waitlist_date || l.intake_date || (l.created_date ? l.created_date.slice(0, 10) : null);
  const d = parseLocalDate(base);
  if (!d) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};

export function useEllRosters() {
  const learnersQ = useQuery({ queryKey: ['ellLearners'], queryFn: () => base44.entities.ELLLearner.list('-created_date', 500) });
  const classesQ = useQuery({ queryKey: ['ell-roster-classes'], queryFn: () => base44.entities.ELLClass.list() });

  const learners = learnersQ.data || [];
  const classes = (classesQ.data || []).filter(c => c.status !== 'cancelled');
  const classById = Object.fromEntries(classes.map(c => [c.id, c]));
  const todayStr = new Date().toISOString().split('T')[0];

  // "Active" = enrolled in a course that is currently running. When no course
  // is running, show learners who took the most recently run course instead.
  const running = classes.filter(c => c.status === 'active' && (!c.end_date || c.end_date >= todayStr));
  let activeLearners = [];
  let rosterNote = '';
  if (running.length) {
    const runningIds = new Set(running.map(c => c.id));
    activeLearners = learners.filter(l => ['enrolled', 'active'].includes(l.enrollment_status) && runningIds.has(l.assigned_class_id));
  } else {
    const recent = [...classes].filter(c => c.end_date).sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
    if (recent) {
      activeLearners = learners.filter(l => ['enrolled', 'active', 'completed'].includes(l.enrollment_status) && l.assigned_class_id === recent.id);
      rosterNote = `No ELL course is currently running — showing learners who took the most recent course (${recent.name}, ended ${recent.end_date}).`;
    }
  }
  activeLearners = [...activeLearners].sort((a, b) =>
    ((a.assigned_class_name || classById[a.assigned_class_id]?.name || '').localeCompare(b.assigned_class_name || classById[b.assigned_class_id]?.name || '')) ||
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  // Waitlist across all courses — longest wait first.
  const waitlisted = learners
    .filter(l => l.enrollment_status === 'waitlisted')
    .sort((a, b) => (daysWaitlisted(a) ?? 0) - (daysWaitlisted(b) ?? 0));

  return { isLoading: learnersQ.isLoading, activeLearners, waitlisted, rosterNote, classById };
}

export function LearnerRosterTable({ mode, learners = [], classById = {}, note, isLoading }) {
  const waitlistMode = mode === 'waitlisted';

  const courseLabel = (l) => {
    if (waitlistMode) {
      return l.interested_course_name ||
        (l.notes || '').match(/^Registered for: (.+)$/m)?.[1] ||
        'General ELL';
    }
    return l.assigned_class_name || classById[l.assigned_class_id]?.name || '—';
  };

  const daysLabel = (l) => {
    const days = daysWaitlisted(l);
    if (days === null) return '—';
    return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`;
  };

  return (
    <Card>
      <CardContent className="p-0">
        {note && <p className="px-4 pt-3 text-xs text-muted-foreground">{note}</p>}
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading learners…</div>
        ) : learners.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {waitlistMode ? 'No learners on the waitlist right now.' : 'No active learners right now.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>{waitlistMode ? 'Course of Interest' : 'Course'}</TableHead>
                <TableHead>CLB Level</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                {waitlistMode && <TableHead>Days Waitlisted</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {learners.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="pl-4 font-medium">{l.first_name} {l.last_name}</TableCell>
                  <TableCell>{courseLabel(l)}</TableCell>
                  <TableCell>{CLB_LABELS[l.clb_level] || '—'}</TableCell>
                  <TableCell>{l.phone || '—'}</TableCell>
                  <TableCell>{l.email || '—'}</TableCell>
                  {waitlistMode && <TableCell>{daysLabel(l)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Standalone Active / Waitlisted learner tabs — used in the Central
// Registration ELL section.
export default function ELLLearnerRosterTabs() {
  const rosters = useEllRosters();
  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active Learners ({rosters.activeLearners.length})</TabsTrigger>
        <TabsTrigger value="waitlisted">Waitlisted Learners ({rosters.waitlisted.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <LearnerRosterTable mode="active" learners={rosters.activeLearners} classById={rosters.classById} note={rosters.rosterNote} isLoading={rosters.isLoading} />
      </TabsContent>
      <TabsContent value="waitlisted">
        <LearnerRosterTable mode="waitlisted" learners={rosters.waitlisted} isLoading={rosters.isLoading} />
      </TabsContent>
    </Tabs>
  );
}