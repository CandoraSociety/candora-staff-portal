import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Briefcase, Rocket, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProgramDeterminationDialog({ open, onOpenChange, client, onSelect }) {
  const [saving, setSaving] = useState(null);

  const handleSelect = async (type) => {
    setSaving(type);
    try {
      await onSelect(type);
      onOpenChange(false);
    } catch {
      toast.error('Failed to save program determination');
    }
    setSaving(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Program Determination Required</DialogTitle>
          <DialogDescription>
            Before proceeding, determine the program stream for{' '}
            <span className="font-semibold text-slate-700">
              {client?.first_name} {client?.last_name}
            </span>
            . This will set the program flow, timeline, and available steps.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* WD */}
          <button
            onClick={() => handleSelect('pathways')}
            disabled={!!saving}
            className="text-left rounded-lg border-2 border-purple-200 bg-purple-50/50 p-5 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900">WD</h3>
                <p className="text-xs text-purple-600 font-medium">Workforce Development</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />Up to 16 weeks of EDA activities</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />Employment search period following EDA</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />90-day follow-up after employment found</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />All must be completed within 52 weeks</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />Includes internal training &amp; paid work exposure</li>
            </ul>
            {saving === 'pathways' && <p className="text-xs text-purple-600 mt-3 font-medium">Saving...</p>}
          </button>

          {/* DEA */}
          <button
            onClick={() => handleSelect('direct_to_employment')}
            disabled={!!saving}
            className="text-left rounded-lg border-2 border-blue-200 bg-blue-50/50 p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">DEA</h3>
                <p className="text-xs text-blue-600 font-medium">Direct Employment Attachment</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />EDA activities completed within 1–2 weeks</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />90-day follow-up commences immediately after</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />No internal training available</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />No paid work exposure available</li>
            </ul>
            {saving === 'direct_to_employment' && <p className="text-xs text-blue-600 mt-3 font-medium">Saving...</p>}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}