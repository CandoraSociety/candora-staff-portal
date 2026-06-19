import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function DeleteEmployeeDialog({ open, onOpenChange, employee, onConfirm, isLoading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" /> Permanently Delete Employee
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete <strong>{employee?.first_name} {employee?.last_name}</strong>?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ This record will be recoverable for <strong>30 days</strong> after deletion. After that it will be permanently removed.
          </div>
          <p className="text-xs text-muted-foreground">
            Note: If you want to end someone's employment while keeping their record, use <strong>Conclude Employment</strong> instead.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-1">
            <p className="font-semibold">🔐 Additional step required to fully revoke login access:</p>
            <p>Go to the <strong>Base44 app editor</strong> → <strong>Dashboard</strong> → <strong>Users</strong> and delete this user to prevent them from logging in.</p>
            <a
              href="https://app.base44.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-700 underline font-medium hover:text-red-900"
            >
              → Open Base44 App Editor
            </a>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}