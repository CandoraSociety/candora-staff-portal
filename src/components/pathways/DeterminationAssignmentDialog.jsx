import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Determination options → service_type mapping
export const DETERMINATION_OPTIONS = [
  { key: 'dea', label: 'DEA', service_type: 'direct_to_employment', description: 'Direct to Employment — assign to a career counsellor.' },
  { key: 'wd', label: 'WD', service_type: 'pathways', description: 'Workforce Development — assign to a career counsellor.' },
  { key: 'casual', label: 'Not eligible - Casual', service_type: 'casual', description: 'Client is not eligible for DEA/WD but will be served as a casual client.' },
  { key: 'not_eligible', label: 'Not eligible', service_type: 'not_eligible', description: 'Client is not eligible for any program stream. Will be rejected.' },
];

export default function DeterminationAssignmentDialog({ client, staffList, onClose, onConfirm }) {
  const [step, setStep] = useState('determination');
  const [determination, setDetermination] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  const selectedOption = DETERMINATION_OPTIONS.find(o => o.key === determination);
  const needsCounsellor = determination === 'dea' || determination === 'wd';

  const handleConfirm = () => {
    if (!selectedOption) return;
    if (needsCounsellor && !selectedWorker) return;
    const worker = staffList.find(s => s.id === selectedWorker);
    onConfirm({
      service_type: selectedOption.service_type,
      worker: needsCounsellor ? { email: worker.email, name: worker.name } : null,
    });
  };

  const canConfirm = selectedOption && (!needsCounsellor || selectedWorker);

  return (
    <Dialog open={!!client} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'determination' ? 'Determination / Assignment' : 'Assign Career Counsellor'}
          </DialogTitle>
        </DialogHeader>

        {step === 'determination' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">
              Determine eligibility and program stream for{' '}
              <span className="font-semibold text-slate-700">
                {client?.first_name} {client?.last_name}
              </span>.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DETERMINATION_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDetermination(opt.key)}
                  className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                    determination === opt.key
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-800 text-sm">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'assign' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Determination:</span>
              <span className="font-semibold text-slate-800">{selectedOption?.label}</span>
            </div>
            <p className="text-sm text-slate-500">
              Assign <span className="font-semibold text-slate-700">{client?.first_name} {client?.last_name}</span> to a career counsellor. The client will appear on their dashboard and the master list under {selectedOption?.label}.
            </p>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger><SelectValue placeholder="Select staff member..." /></SelectTrigger>
              <SelectContent>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffList.length === 0 && (
              <p className="text-sm text-amber-600">No staff found. Add staff in the Master List.</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'assign' ? (
            <Button variant="outline" onClick={() => setStep('determination')} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          {step === 'determination' ? (
            <Button
              disabled={!determination}
              onClick={() => needsCounsellor ? setStep('assign') : handleConfirm()}
              className="gap-1"
            >
              {needsCounsellor ? <>Continue <ArrowRight className="w-4 h-4" /></> : 'Confirm'}
            </Button>
          ) : (
            <Button disabled={!canConfirm} onClick={handleConfirm}>
              Confirm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}