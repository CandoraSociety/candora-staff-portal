import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function HowToAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ question: '', answer: '', keywords: '', category: '' });

  const { data: answers = [] } = useQuery({
    queryKey: ['howToAnswers'],
    queryFn: () => base44.entities.HowToAnswer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HowToAnswer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['howToAnswers']);
      toast.success('Answer added!');
      setShowAddForm(false);
      setDraft({ question: '', answer: '', keywords: '', category: '' });
    },
    onError: () => toast.error('Failed to add answer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HowToAnswer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['howToAnswers']);
      toast.success('Answer updated!');
      setEditing(null);
    },
    onError: () => toast.error('Failed to update answer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HowToAnswer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['howToAnswers']);
      toast.success('Answer deleted!');
    },
    onError: () => toast.error('Failed to delete answer'),
  });

  const parseKeywords = (str) => str.split(',').map(k => k.trim()).filter(Boolean);

  const handleSave = () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    createMutation.mutate({
      ...draft,
      keywords: parseKeywords(draft.keywords),
      is_active: true,
    });
  };

  const handleUpdate = () => {
    if (!editing.question.trim() || !editing.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    updateMutation.mutate({
      id: editing.id,
      data: {
        question: editing.question,
        answer: editing.answer,
        keywords: parseKeywords(editing.keywordsStr || ''),
        category: editing.category,
      },
    });
  };

  const startEdit = (answer) => {
    setEditing({
      ...answer,
      keywordsStr: (answer.keywords || []).join(', '),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">How-To Knowledge Base Admin</h1>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4" />
          Add Answer
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Add New Answer</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Question</label>
            <Input
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              placeholder="e.g., How do I submit an expense report?"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Answer</label>
            <Textarea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              placeholder="Provide a clear, detailed answer..."
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Keywords (comma-separated)</label>
            <Input
              value={draft.keywords}
              onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
              placeholder="e.g., expense, reimbursement, finance"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate keywords with commas</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Category (optional)</label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="e.g., HR, Finance, IT"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              <Save className="w-4 h-4" />
              Save Answer
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Knowledge Base ({answers.length} entries)</h2>
        {answers.map((answer) => (
          <div key={answer.id} className="rounded-xl border bg-card p-4">
            {editing?.id === answer.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Question</label>
                  <Input
                    value={editing.question}
                    onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Answer</label>
                  <Textarea
                    value={editing.answer}
                    onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Keywords</label>
                  <Input
                    value={editing.keywordsStr}
                    onChange={(e) => setEditing({ ...editing, keywordsStr: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-foreground mb-2">{answer.question}</p>
                <p className="text-sm text-muted-foreground mb-3">{answer.answer}</p>
                {answer.keywords && answer.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {answer.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(answer)}>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(answer.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}