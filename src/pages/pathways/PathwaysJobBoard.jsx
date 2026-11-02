import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Briefcase, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import JobPostingDialog from '@/components/pathways/JobPostingDialog';
import { EMPLOYMENT_TYPE_LABELS, formatDate, isPast } from '@/lib/joblab/constants';

const QUERY_KEY = ['joblab-jobs'];

export default function PathwaysJobBoard() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => base44.entities.JobLabJob.list('-created_date', 200),
  });

  const { data: user } = useQuery({
    queryKey: ['pathways-job-board-me'],
    queryFn: () => base44.auth.me(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const toggleActive = async (job, active) => {
    try {
      await base44.entities.JobLabJob.update(job.id, { is_active: active });
      refresh();
    } catch (error) {
      toast.error('Could not update: ' + (error.message || ''));
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.JobLabJob.delete(deleting.id);
      toast.success('Posting removed');
      refresh();
    } catch (error) {
      toast.error('Could not delete: ' + (error.message || ''));
    }
    setDeleting(null);
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (job) => {
    setEditing(job);
    setDialogOpen(true);
  };

  const live = jobs.filter((job) => job.is_active !== false && (!job.closing_date || !isPast(job.closing_date)));
  const expired = jobs.filter((job) => job.closing_date && isPast(job.closing_date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Briefcase className="h-6 w-6" /> Job Board
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Local postings shown on the Job Lab board. Participants can save any posting straight to their tracker.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Posting</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Postings ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No postings yet. Add one and it appears on the Job Lab board for participants.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const closed = job.closing_date && isPast(job.closing_date);
                return (
                  <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">{job.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {EMPLOYMENT_TYPE_LABELS[job.employment_type] || 'Full-time'}
                        </Badge>
                        {closed && <Badge variant="outline" className="bg-slate-100 text-xs text-slate-600">closed</Badge>}
                        {!job.is_active && <Badge variant="outline" className="bg-amber-50 text-xs text-amber-700">hidden</Badge>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-600">
                        <span>{job.employer_name}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        {job.wage && <span>{job.wage}</span>}
                        {job.closing_date && <span>Closes {formatDate(job.closing_date)}</span>}
                        {job.created_by_name && <span>Posted by {job.created_by_name}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Switch checked={job.is_active !== false} onCheckedChange={(value) => toggleActive(job, value)} />
                        <span className="text-xs text-slate-500">On board</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(job)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting(job)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {expired.length > 0 && (
        <p className="text-xs text-slate-500">
          {expired.length} posting{expired.length === 1 ? '' : 's'} have passed their closing date and no longer appear on
          the Job Lab board.
        </p>
      )}

      {live.length === 0 && jobs.length > 0 && (
        <p className="text-xs text-slate-500">No postings are currently showing on the Job Lab board.</p>
      )}

      <JobPostingDialog
        open={dialogOpen}
        job={editing}
        authorName={user?.full_name || user?.email || ''}
        onClose={() => setDialogOpen(false)}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleting} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this posting?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be deleted permanently. If you only want to take it off the board, switch
              "On board" off instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}