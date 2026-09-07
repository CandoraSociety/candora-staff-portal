import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Plus, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
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

export default function LessonPlansTab({ cls, userName, saveClass, selectedDate }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const plans = [...(cls.lesson_plans || [])].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveClass({
        lesson_plans: [...(cls.lesson_plans || []), {
          id: crypto.randomUUID(),
          title: title.trim(),
          date: selectedDate || null,
          content: content.trim(),
          created_by_name: userName,
          created_date: format(new Date(), 'yyyy-MM-dd'),
        }],
      });
      setTitle(''); setContent('');
      toast({ title: 'Lesson plan created' });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveClass({
        lesson_plans: [...(cls.lesson_plans || []), {
          id: crypto.randomUUID(),
          title: file.name,
          date: selectedDate || null,
          file_url,
          file_name: file.name,
          created_by_name: userName,
          created_date: format(new Date(), 'yyyy-MM-dd'),
        }],
      });
      toast({ title: 'Lesson plan uploaded' });
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Create a Lesson Plan</h3>
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 — Past tense" />
            </div>
            <p className="text-xs text-muted-foreground">
              Attached to {selectedDate ? format(parseLocalDate(selectedDate), 'MMM d, yyyy') : 'the date selected in the calendar'}
            </p>
            <div>
              <Label>Content *</Label>
              <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Objectives, activities, materials, homework..." />
            </div>
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Create Plan'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Upload a Lesson Plan</h3>
            <p className="text-sm text-muted-foreground">Attach an existing document (PDF, Word, etc.).</p>
            <p className="text-xs text-muted-foreground">
              Attached to {selectedDate ? format(parseLocalDate(selectedDate), 'MMM d, yyyy') : 'the date selected in the calendar'}
            </p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 px-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to choose a file'}</span>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">Lesson Plans</h3>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No lesson plans yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {plans.map(p => (
                <div key={p.id} className="border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{p.title}</span>
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: p.file_url ? '#0284c7' : '#16a34a' }}>
                      {p.file_url ? 'Uploaded' : 'Created'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {p.date && <span>For: {format(parseLocalDate(p.date), 'MMM d, yyyy')}</span>}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}