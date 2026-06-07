import { Badge } from '@/components/ui/badge';

const statusColors = {
  active: 'bg-primary/20 text-primary',
  inactive: 'bg-muted text-muted-foreground',
  draft: 'bg-secondary/20 text-secondary-foreground',
  submitted: 'bg-primary/20 text-primary',
  acknowledged: 'bg-primary/20 text-primary',
  open: 'bg-secondary/30 text-secondary-foreground',
  under_investigation: 'bg-secondary/30 text-secondary-foreground',
  resolved: 'bg-primary/20 text-primary',
  closed: 'bg-muted text-muted-foreground',
  low: 'bg-secondary/20 text-secondary-foreground',
  medium: 'bg-accent/20 text-accent-foreground',
  high: 'bg-destructive/20 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
  completed: 'bg-primary/20 text-primary',
  in_progress: 'bg-accent/20 text-accent-foreground',
  expired: 'bg-destructive/20 text-destructive',
  scheduled: 'bg-secondary/20 text-secondary-foreground',
  pending: 'bg-accent/20 text-accent-foreground',
  terminated: 'bg-destructive/20 text-destructive',
  suspended: 'bg-destructive/20 text-destructive',
  probation: 'bg-accent/20 text-accent-foreground',
  on_leave: 'bg-secondary/20 text-secondary-foreground',
};

export default function StatusBadge({ status }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  return (
    <Badge className={`${colorClass} border-0 capitalize`}>
      {status?.replace(/_/g, ' ')}
    </Badge>
  );
}