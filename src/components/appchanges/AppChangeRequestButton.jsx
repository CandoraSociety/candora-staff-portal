import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lightbulb, Send, Loader2, Clock } from 'lucide-react';

const ALLOWED_EMAILS = [
  'luis.valbuena@candorasociety.com',
  'yazmin.escobar@candorasociety.com',
  'carla.bosse@candorasociety.com',
  'graham.currie@candorasociety.com',
];

const CATEGORIES = [
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'addition', label: 'New Addition' },
  { value: 'change_request', label: 'Change Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AppChangeRequestButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [requestText, setRequestText] = useState('');
  const [category, setCategory] = useState('change_request');
  const queryClient = useQueryClient();

  const userEmail = user?.email?.toLowerCase();
  const isAllowed = userEmail && ALLOWED_EMAILS.includes(userEmail);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.AppChangeRequest.create(data),
    onSuccess: () => {
      toast.success('Request submitted!');
      setTitle('');
      setRequestText('');
      setCategory('change_request');
      queryClient.invalidateQueries(['appChangeRequests', userEmail]);
      queryClient.invalidateQueries(['appChangeRequests', 'all']);
    },
    onError: () => toast.error('Failed to submit request'),
  });

  const { data: myRequests = [], isLoading: isLoadingMine } = useQuery({
    queryKey: ['appChangeRequests', userEmail],
    queryFn: () => base44.entities.AppChangeRequest.filter({ submitted_by_email: user.email }, '-created_date', 50),
    enabled: open && !!userEmail && isAllowed,
  });

  if (!isAllowed) return null;

  const handleSubmit = () => {
    if (!requestText.trim()) {
      toast.error('Please describe your request');
      return;
    }
    submitMutation.mutate({
      title: title.trim() || undefined,
      request_text: requestText.trim(),
      submitted_by_name: user.full_name || user.email,
      submitted_by_email: user.email,
      category,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-gradient-to-r from-accent to-accent/80 text-white font-semibold text-sm hover:shadow-xl hover:scale-105 transition-all"
      >
        <Lightbulb className="h-5 w-5" />
        App Adjustments
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              App Adjustments / Additions / Change Requests
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="submit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submit" className="gap-2"><Send className="h-4 w-4" /> New Request</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> My Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary..." />
              </div>
              <div className="space-y-2">
                <Label>Details *</Label>
                <Textarea value={requestText} onChange={e => setRequestText(e.target.value)} rows={6} placeholder="Describe the adjustment, addition, or change you'd like..." />
              </div>
              <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full gap-2">
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Request
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
              {isLoadingMine ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : myRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
              ) : (
                myRequests.map(req => (
                  <div key={req.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {req.title && <p className="font-semibold text-sm">{req.title}</p>}
                        <span className="text-xs text-muted-foreground">{formatDate(req.created_date)}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_CONFIG[req.status]?.color || STATUS_CONFIG.new.color}`}>
                        {STATUS_CONFIG[req.status]?.label || 'New'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{req.request_text}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}