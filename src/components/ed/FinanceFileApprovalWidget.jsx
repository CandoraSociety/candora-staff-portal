import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Shown on the Executive Director dashboard. Surfaces pending Finance Files
 * access requests created during employee setup, with Accept / Reject actions.
 * Renders nothing when there are no pending requests.
 */
export default function FinanceFileApprovalWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['finance-file-approvals'],
    queryFn: () => base44.entities.FileAccessApprovalRequest.filter({ status: 'pending' }, '-requested_date', 50),
  });

  const grantFinance = async (email) => {
    const perms = await base44.entities.AccessPermission.list();
    const existing = perms.find(p =>
      p.target_type === 'file_access' && p.target_id === 'finance' &&
      p.scope_type === 'individual' && p.is_active &&
      p.scope_value?.toLowerCase() === email?.toLowerCase()
    );
    if (existing) {
      await base44.entities.AccessPermission.update(existing.id, { permission: 'allow', is_active: true });
    } else {
      await base44.entities.AccessPermission.create({
        target_type: 'file_access',
        target_id: 'finance',
        scope_type: 'individual',
        scope_value: email,
        permission: 'allow',
        is_active: true,
      });
    }
  };

  const handleApprove = async (req) => {
    setActing(req.id);
    try {
      await grantFinance(req.employee_email);
      await base44.entities.FileAccessApprovalRequest.update(req.id, {
        status: 'approved',
        reviewed_by_name: user?.full_name || user?.email || 'Executive Director',
        reviewed_by_email: user?.email || '',
        reviewed_date: new Date().toISOString().slice(0, 10),
      });
      queryClient.invalidateQueries({ queryKey: ['finance-file-approvals'] });
    } catch (e) {
      alert('Failed to approve: ' + (e.message || 'Unknown error'));
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt('Optional reason for rejecting Finance Files access:', '') ?? '';
    setActing(req.id);
    try {
      await base44.entities.FileAccessApprovalRequest.update(req.id, {
        status: 'rejected',
        reviewed_by_name: user?.full_name || user?.email || 'Executive Director',
        reviewed_by_email: user?.email || '',
        reviewed_date: new Date().toISOString().slice(0, 10),
        rejection_reason: reason || '',
      });
      queryClient.invalidateQueries({ queryKey: ['finance-file-approvals'] });
    } catch (e) {
      alert('Failed to reject: ' + (e.message || 'Unknown error'));
    } finally {
      setActing(null);
    }
  };

  if (isLoading || requests.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" /> Finance File Access Requests
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          These employees were granted Finance Files access during setup and need your approval before access is activated.
        </p>
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/40">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{req.employee_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                Requested by {req.requested_by_name || 'Unknown'}
                {req.requested_date ? ` · ${format(new Date(req.requested_date), 'MMM d, yyyy')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => handleApprove(req)} disabled={acting === req.id} className="h-8 gap-1">
                {acting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(req)} disabled={acting === req.id} className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50">
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}