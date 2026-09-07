import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ArrowLeft, Clock, MapPin, User as UserIcon, CalendarRange, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ParticipantsTab from '@/components/ell/classdetail/ParticipantsTab';
import AttendanceTab from '@/components/ell/classdetail/AttendanceTab';
import NotesTab from '@/components/ell/classdetail/NotesTab';
import LessonPlansTab from '@/components/ell/classdetail/LessonPlansTab';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const statusColors = {
  planning: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  completed: 'bg-accent/10 text-accent-foreground',
  cancelled: 'bg-destructive/10 text-destructive-foreground',
};

export default function ELLClassDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState('Staff');

  useEffect(() => {
    base44.auth.me().then(me => setUserName(me?.full_name || 'Staff')).catch(() => {});
  }, []);

  const classQ = useQuery({ queryKey: ['ellClass', id], queryFn: () => base44.entities.ELLClass.get(id) });
  const learnersQ = useQuery({ queryKey: ['ellLearners'], queryFn: () => base44.entities.ELLLearner.list() });

  const saveClass = async (patch) => {
    await base44.entities.ELLClass.update(id, patch);
    queryClient.invalidateQueries({ queryKey: ['ellClass', id] });
    queryClient.invalidateQueries({ queryKey: ['ellClasses'] });
  };

  if (classQ.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const cls = classQ.data;
  if (!cls) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">Class not found.</p>
        <Button variant="outline" asChild><Link to="/ell/classes">Back to Classes</Link></Button>
      </div>
    );
  }

  const participants = (learnersQ.data || []).filter(l => l.assigned_class_id === id);
  const startDate = cls.start_date ? parseLocalDate(cls.start_date) : null;
  const endDate = cls.end_date ? parseLocalDate(cls.end_date) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/ell/classes"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-display font-bold">{cls.name}</h1>
            <Badge className={statusColors[cls.status] || 'bg-muted text-muted-foreground'}>{cls.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 ml-11 text-sm text-muted-foreground">
            {cls.clb_level && <Badge variant="secondary" className="text-xs">{cls.clb_level.replace('_', ' ').toUpperCase()}</Badge>}
            {cls.schedule_days?.length > 0 && (
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span className="capitalize text-xs">{cls.schedule_days.join(', ')}</span>{cls.start_time && <span className="text-xs">{cls.start_time}{cls.end_time ? `–${cls.end_time}` : ''}</span>}</span>
            )}
            {cls.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /><span className="text-xs">{cls.location}</span></span>}
            {cls.instructor_name && <span className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" /><span className="text-xs">{cls.instructor_name}</span></span>}
            {startDate && <span className="flex items-center gap-1.5"><CalendarRange className="h-4 w-4" /><span className="text-xs">{format(startDate, 'MMM d, yyyy')} – {endDate ? format(endDate, 'MMM d, yyyy') : ''}</span></span>}
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span className="text-xs">{participants.length} / {cls.capacity || '—'} enrolled</span></span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="participants" className="mt-4">
          <ParticipantsTab participants={participants} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab cls={cls} participants={participants} userName={userName} saveClass={saveClass} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab cls={cls} userName={userName} saveClass={saveClass} />
        </TabsContent>
        <TabsContent value="lesson-plans" className="mt-4">
          <LessonPlansTab cls={cls} userName={userName} saveClass={saveClass} />
        </TabsContent>
      </Tabs>
    </div>
  );
}