import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Mic } from 'lucide-react';
import InterviewPrepForm from '@/components/marketing/media/InterviewPrepForm';
import GuideList from '@/components/marketing/media/GuideList';

const STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const formatWhen = (value) => {
  if (!value) return 'No date set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date set';
  return date.toLocaleString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

export default function InterviewPrepTab({ releases = [], search = '' }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data: preps = [] } = useQuery({
    queryKey: ['interviewPreps'],
    queryFn: () => base44.entities.InterviewPrep.list('-interview_date'),
  });

  const save = useMutation({
    mutationFn: (data) => (data.id
      ? base44.entities.InterviewPrep.update(data.id, data)
      : base44.entities.InterviewPrep.create(data)),
    onSuccess: () => { qc.invalidateQueries(['interviewPreps']); closeDialog(); },
  });

  const closeDialog = () => { setOpen(false); setEditItem(null); };
  const openDialog = (item) => { setEditItem(item || null); setOpen(true); };

  const q = search.toLowerCase();
  const visible = preps.filter((p) => `${p.title} ${p.outlet} ${p.interviewer} ${p.press_release_title}`.toLowerCase().includes(q));

  return (
    <div className="space-y-4 mt-4">
      <GuideList />

      <div className="flex items-center justify-between pt-3 border-t">
        <p className="font-medium">Prep sessions</p>
        <Button size="sm" onClick={() => openDialog(null)}>
          <Plus className="w-4 h-4 mr-1" /> New Prep
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map((prep) => (
          <Card key={prep.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openDialog(prep)}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium leading-snug">{prep.title}</p>
                <Badge className={STATUS_COLORS[prep.status] || ''}>{prep.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mic className="w-3 h-3" />
                {[prep.outlet, prep.interviewer].filter(Boolean).join(' · ') || 'Outlet not set'}
              </p>
              <p className="text-xs text-muted-foreground">{formatWhen(prep.interview_date)}</p>
              {prep.press_release_title && (
                <p className="text-xs flex items-center gap-1 text-foreground/70">
                  <FileText className="w-3 h-3" /> {prep.press_release_title}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {preps.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No interview prep yet
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Interview Prep' : 'New Interview Prep'}</DialogTitle>
          </DialogHeader>
          <InterviewPrepForm
            item={editItem}
            releases={releases}
            onClose={closeDialog}
            onSave={(data) => save.mutate({ ...data, created_by_name: data.created_by_name || editItem?.created_by_name })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}