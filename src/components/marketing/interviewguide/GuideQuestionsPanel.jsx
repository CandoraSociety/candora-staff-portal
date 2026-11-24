import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Mic, CheckCircle2 } from 'lucide-react';
import GuideQuestionDialog from './GuideQuestionDialog';

// Add, edit, reorder and narrate the questions in a guide.
export default function GuideQuestionsPanel({ questions, onSave, onDelete, onMove, onGenerate, busy }) {
  const [editing, setEditing] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length === 1 ? '' : 's'} in this guide.
        </p>
        <Button size="sm" onClick={() => setEditing({})}><Plus className="w-4 h-4 mr-1" /> Add question</Button>
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="rounded-xl border p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-[#fccf03] text-[#0a0f29] font-bold text-sm flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <p className="text-sm font-medium leading-snug">{question.question}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(question, -1)} aria-label="Move up">
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" disabled={index === questions.length - 1} onClick={() => onMove(question, 1)} aria-label="Move down">
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(question)} aria-label="Edit question">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(question)} aria-label="Delete question">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pl-10">
            <Button
              size="sm"
              variant="outline"
              disabled={!question.narration?.trim() || busy[question.id]}
              onClick={() => onGenerate(question)}
            >
              <Mic className="w-3.5 h-3.5 mr-1" />
              {busy[question.id] ? 'Generating…' : question.audio_url ? 'Regenerate audio' : 'Generate audio'}
            </Button>
            {question.audio_url ? (
              <>
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Audio ready
                </Badge>
                <audio controls src={question.audio_url} className="h-8" />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No audio generated yet</span>
            )}
          </div>
        </div>
      ))}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit question' : 'New question'}</DialogTitle>
          </DialogHeader>
          <GuideQuestionDialog
            question={editing?.id ? editing : null}
            onClose={() => setEditing(null)}
            onSave={(data) => { onSave(editing?.id ? { ...data, id: editing.id } : data); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}