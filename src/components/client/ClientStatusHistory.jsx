import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const CHANGE_TYPE_CONFIG = {
  stream_switch: { label: 'Stream Switch', color: 'bg-blue-500' },
  program_status_change: { label: 'Program Status', color: 'bg-green-500' },
  file_opened: { label: 'File Opened', color: 'bg-emerald-500' },
  file_closed: { label: 'File Closed', color: 'bg-red-500' },
  employment_outcome: { label: 'Employment Outcome', color: 'bg-purple-500' },
  post_completion_status: { label: 'Post-Completion Status', color: 'bg-indigo-500' },
  followup_90day: { label: '90-Day Follow-up', color: 'bg-orange-500' },
  other: { label: 'Other', color: 'bg-slate-500' },
};

export default function ClientStatusHistory({ client }) {
  const [statusChanges, setStatusChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusChanges = async () => {
      try {
        const changes = await base44.entities.StatusChange.filter({ client_id: client.id }, '-change_date');
        setStatusChanges(changes);
      } catch (error) {
        console.error('Failed to load status changes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusChanges();
  }, [client.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (statusChanges.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No status changes recorded
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {statusChanges.map((change, index) => {
        const config = CHANGE_TYPE_CONFIG[change.change_type] || CHANGE_TYPE_CONFIG.other;
        return (
          <Card key={change.id || index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full ${config.color} mt-2`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{config.label}</Badge>
                      <span className="font-medium">{change.change_date}</span>
                    </div>
                    {change.logged_by_name && (
                      <span className="text-xs text-muted-foreground">
                        by {change.logged_by_name}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm">
                    {change.from_value && change.to_value ? (
                      <span>
                        <span className="text-muted-foreground">From:</span> {change.from_value}
                        <span className="mx-2">→</span>
                        <span className="font-medium">{change.to_value}</span>
                      </span>
                    ) : (
                      <span>{change.notes}</span>
                    )}
                  </div>

                  {change.notes && change.from_value && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {change.notes}
                    </div>
                  )}

                  {change.billing_relevant && (
                    <Badge className="mt-2" variant="secondary">
                      Billing Relevant
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}