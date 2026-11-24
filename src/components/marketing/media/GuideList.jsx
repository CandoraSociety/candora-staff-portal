import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Link2, Pencil, Mic } from 'lucide-react';
import { newToken, shareLink } from '@/lib/interviewGuides';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-600',
};

// The interactive guides staff have built, listed beside the prep sessions.
export default function GuideList() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: guides = [] } = useQuery({
    queryKey: ['interviewGuides'],
    queryFn: () => base44.entities.InterviewGuide.list('-created_date'),
  });
  const { data: questions = [] } = useQuery({
    queryKey: ['interviewGuideQuestionsAll'],
    queryFn: () => base44.entities.InterviewGuideQuestion.list(),
  });

  const create = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me().catch(() => null);
      return base44.entities.InterviewGuide.create({
        title: 'Untitled interview guide',
        token: newToken(),
        status: 'draft',
        voice: 'honey',
        created_by_name: me?.full_name || '',
      });
    },
    onSuccess: (guide) => {
      qc.invalidateQueries(['interviewGuides']);
      navigate(`/marketing/interview-guides/${guide.id}`);
    },
  });

  const copy = (guide) => navigator.clipboard.writeText(shareLink(guide));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Interactive guides</p>
          <p className="text-sm text-muted-foreground">
            Read, listen and practise guides sent to a spokesperson through their own link.
          </p>
        </div>
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="w-4 h-4 mr-1" /> New guide
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {guides.map((guide) => {
          const count = questions.filter((q) => q.guide_id === guide.id).length;
          const ready = questions.filter(
            (q) => q.guide_id === guide.id && (q.narration_segments || []).some((segment) => segment.audio_url)
          ).length;
          return (
            <Card key={guide.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium leading-snug">{guide.title}</p>
                  <Badge className={STATUS_COLORS[guide.status] || ''}>{guide.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {count} question{count === 1 ? '' : 's'} · {ready} narrated
                  {guide.spokesperson ? ` · for ${guide.spokesperson}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/marketing/interview-guides/${guide.id}`)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {guide.status === 'published' && (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <a href={shareLink(guide)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open guide
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copy(guide)}>
                        <Link2 className="w-3.5 h-3.5 mr-1" /> Copy link
                      </Button>
                    </>
                  )}
                  {guide.status !== 'published' && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Publish to share the link
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {guides.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No interview guides yet</CardContent></Card>
      )}
    </div>
  );
}