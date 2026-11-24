import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ExternalLink, Link2 } from 'lucide-react';
import { shareLink } from '@/lib/interviewGuides';

const STATUSES = ['draft', 'published', 'archived'];

export default function GuideMetaPanel({ guide, patch, onSave, saving }) {
  const copy = () => navigator.clipboard.writeText(shareLink(guide));

  return (
    <div className="space-y-3">
      <div>
        <Label>Guide title</Label>
        <Input value={guide.title || ''} onChange={(e) => patch({ title: e.target.value })} />
      </div>
      <div>
        <Label>What this guide prepares</Label>
        <Textarea rows={2} value={guide.purpose || ''} onChange={(e) => patch({ purpose: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Spokesperson</Label><Input value={guide.spokesperson || ''} onChange={(e) => patch({ spokesperson: e.target.value })} /></div>
        <div><Label>Interviewer</Label><Input value={guide.interviewer || ''} onChange={(e) => patch({ interviewer: e.target.value })} /></div>
        <div><Label>Show</Label><Input value={guide.show_name || ''} onChange={(e) => patch({ show_name: e.target.value })} /></div>
        <div><Label>Outlet</Label><Input value={guide.outlet || ''} onChange={(e) => patch({ outlet: e.target.value })} /></div>
        <div><Label>Interview date</Label><Input type="date" value={guide.interview_date || ''} onChange={(e) => patch({ interview_date: e.target.value })} /></div>
      </div>
      <p className="text-xs text-muted-foreground">
        The narrator voice is chosen and previewed on the Narration tab.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={guide.status || 'draft'} onValueChange={(v) => patch({ status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Assigned to</Label>
          <Input value={guide.assigned_to_name || ''} onChange={(e) => patch({ assigned_to_name: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button onClick={onSave} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save guide'}</Button>
        <Button variant="outline" onClick={copy}><Link2 className="w-4 h-4 mr-1" /> Copy share link</Button>
        {guide.status === 'published' && (
          <Button variant="ghost" asChild>
            <a href={shareLink(guide)} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-1" /> Open guide</a>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground break-all">{shareLink(guide)}</p>
      {guide.status !== 'published' && (
        <p className="text-xs text-muted-foreground">The link only opens once the guide is published.</p>
      )}
    </div>
  );
}