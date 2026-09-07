import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function CourseLessonPlansDialog({ course, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [plans, setPlans] = useState(course?.lesson_plans || []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('Staff');

  useEffect(() => {
    base44.auth.me().then(me => setUserName(me?.full_name || 'Staff')).catch(() => {});
  }, []);

  const persist = async (next) => {
    await base44.entities.ELLClass.update(course.id, { lesson_plans: next });
    setPlans(next);
    queryClient.invalidateQueries({ queryKey: ['ell-courses-classes'] });
    queryClient.invalidateQueries({ queryKey: ['ellClass', course.id] });
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await persist([...plans, {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        created_by_name: userName,
        created_date: format(new Date(), 'yyyy-MM-dd'),
      }]);
      setTitle(''); setContent('');
      toast({ title: 'Lesson plan added to course' });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    try {
      await persist(plans.filter(p => p.id !== plan.id));
      toast({ title: 'Lesson plan removed' });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    }
  };

  const sorted = [...plans].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lesson Plans — {course?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Create a Lesson Plan</h3>
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 — Past tense" />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Objectives, activities, materials, homework..." />
            </div>
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Add to Course'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Course Material ({sorted.length})</h3>
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No lesson plans for this course yet.</p>
            ) : sorted.map(p => (
              <div key={p.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.title}</span>
                  </p>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>By: {p.created_by_name || 'Staff'}</span>
                  {p.created_date && <span>Added: {format(parseLocalDate(p.created_date), 'MMM d, yyyy')}</span>}
                </div>
                {p.file_url ? (
                  <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                    <Download className="h-3.5 w-3.5" />Download {p.file_name || 'file'}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto border-t pt-2">{p.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}