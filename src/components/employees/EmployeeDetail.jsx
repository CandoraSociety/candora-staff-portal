import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/shared/StatusBadge';

export default function EmployeeDetail({ employee, isHRAdmin, onEdit, onDelete }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', employee?.id],
    queryFn: () => base44.entities.PerformanceReview.filter({ employee_id: employee.id }, '-review_date', 10),
    enabled: !!employee?.id,
  });

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
          <p className="text-muted-foreground">{employee.position}</p>
        </div>
        {isHRAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
            <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Email</span><p className="font-medium">{employee.email}</p></div>
        <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{employee.phone || '—'}</p></div>
        <div><span className="text-muted-foreground">Department</span><p className="font-medium">{employee.department}</p></div>
        <div><span className="text-muted-foreground">Status</span><div className="mt-1"><StatusBadge status={employee.status} /></div></div>
        {employee.hire_date && (
          <div><span className="text-muted-foreground">Hire Date</span><p className="font-medium">{format(new Date(employee.hire_date), 'MMM d, yyyy')}</p></div>
        )}
        {isHRAdmin && employee.salary && (
          <div><span className="text-muted-foreground">Salary</span><p className="font-medium">${employee.salary.toLocaleString()}</p></div>
        )}
      </div>

      {isHRAdmin && employee.notes && (
        <div>
          <p className="text-muted-foreground text-sm mb-1">Notes</p>
          <p className="text-sm bg-muted/50 rounded p-3">{employee.notes}</p>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Performance Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews on file.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map(rev => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{rev.review_period}</span>
                  {rev.review_date && <span className="text-muted-foreground">{format(new Date(rev.review_date), 'MMM d, yyyy')}</span>}
                </div>
                <StatusBadge status={rev.overall_rating} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}