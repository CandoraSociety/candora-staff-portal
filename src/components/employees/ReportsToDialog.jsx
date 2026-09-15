import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog } from 'lucide-react';

// Edit dialog for an employee's supervisor (Reports To / manager_email).
// Lists active employees (excluding the employee themselves) to pick from.
export default function ReportsToDialog({ open, onOpenChange, employee }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(employee?.manager_email || 'none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(employee?.manager_email || 'none');
  }, [open, employee?.manager_email]);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 500),
    enabled: open,
  });

  const options = employees
    .filter(e => e.id !== employee?.id && !e.is_deleted && e.status !== 'terminated')
    .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Employee.update(employee.id, {
        manager_email: value === 'none' ? '' : value,
      });
      queryClient.invalidateQueries({ queryKey: ['employee', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Reports To — {employee?.first_name} {employee?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supervisor</p>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading employees…' : 'Select a supervisor'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No supervisor —</SelectItem>
                {options.map(e => (
                  <SelectItem key={e.id} value={e.email}>
                    {e.first_name} {e.last_name} — {e.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vacation requests and timesheets from this employee will be routed to their supervisor for approval.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || isLoading}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}