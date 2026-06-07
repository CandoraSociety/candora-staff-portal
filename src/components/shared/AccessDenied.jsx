import { AlertTriangle } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive/50 mb-4" />
      <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
      <p className="text-muted-foreground mt-1 text-sm">You don't have permission to access this section.</p>
    </div>
  );
}