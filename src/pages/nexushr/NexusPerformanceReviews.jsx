import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ReviewForm from '@/components/reviews/ReviewForm';
import { format } from 'date-fns';

export default function NexusPerformanceReviews() {
  const { user, employees } = useSupervisorAccess();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({ queryKey: ['reviews'], queryFn: () => base44.entities.PerformanceReview.list('-created_date', 100) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceReview.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); setShowForm(false); },
  });

  const visibleReviews = reviews;
  const formEmployees = employees;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />New Review</Button>}
      />

      {visibleReviews.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No reviews yet" description="Start by creating a performance review." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Period</th>
                  <th className="p-4 font-medium hidden md:table-cell">Rating</th>
                  <th className="p-4 font-medium hidden md:table-cell">Reviewer</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Date</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleReviews.map(rev => (
                  <tr key={rev.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setViewing(rev)}>
                    <td className="p-4 font-medium">{rev.employee_name}</td>
                    <td className="p-4">{rev.review_period}</td>
                    <td className="p-4 hidden md:table-cell">{rev.overall_rating?.replace(/_/g, ' ')}</td>
                    <td className="p-4 hidden md:table-cell">{rev.reviewer_name}</td>
                    <td className="p-4 hidden lg:table-cell">{rev.review_date && format(new Date(rev.review_date), 'MMM d, yyyy')}</td>
                    <td className="p-4"><StatusBadge status={rev.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
          <ReviewForm employees={formEmployees} user={user} onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Details — {viewing?.employee_name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Period</p><p className="font-medium">{viewing.review_period}</p></div>
              <div><p className="text-muted-foreground">Overall Rating</p><p className="font-medium">{viewing.overall_rating?.replace(/_/g, ' ')}</p></div>
              <div><p className="text-muted-foreground">Reviewer</p><p className="font-medium">{viewing.reviewer_name}</p></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium">{viewing.review_date && format(new Date(viewing.review_date), 'MMM d, yyyy')}</p></div>
              {viewing.strengths && <div className="col-span-2"><p className="text-muted-foreground">Strengths</p><p>{viewing.strengths}</p></div>}
              {viewing.areas_for_improvement && <div className="col-span-2"><p className="text-muted-foreground">Areas for Improvement</p><p>{viewing.areas_for_improvement}</p></div>}
              {viewing.comments && <div className="col-span-2"><p className="text-muted-foreground">Comments</p><p>{viewing.comments}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}