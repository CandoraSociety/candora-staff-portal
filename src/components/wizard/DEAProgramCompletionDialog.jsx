import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, ArrowRight, XCircle } from 'lucide-react';

export default function DEAProgramCompletionDialog({ open, onOpenChange, onComplete, onSwitchToWD, onTerminate }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>DEA Program Completion</DialogTitle>
          <DialogDescription>
            The 2-week DEA program period has been reached. Please choose how to proceed with this client's file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <button
            onClick={onComplete}
            className="w-full text-left rounded-lg border-2 border-green-200 bg-green-50/50 p-4 hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <h3 className="font-bold text-green-900">Complete Program</h3>
                <p className="text-xs text-green-700 mt-0.5">Client has successfully completed EDAs and is likely to find work. Enter 90-day follow-up period.</p>
              </div>
            </div>
          </button>

          <button
            onClick={onSwitchToWD}
            className="w-full text-left rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4 hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ArrowRight className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <h3 className="font-bold text-purple-900">Switch to WD Pathway</h3>
                <p className="text-xs text-purple-700 mt-0.5">Client needs more development. Transfer to Workforce Development pathway.</p>
              </div>
            </div>
          </button>

          <button
            onClick={onTerminate}
            className="w-full text-left rounded-lg border-2 border-red-200 bg-red-50/50 p-4 hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900">Terminate Program</h3>
                <p className="text-xs text-red-700 mt-0.5">Client is no longer participative or program should end unsuccessfully.</p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}