import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Baby, Plus, Clock, MapPin } from 'lucide-react';
import ChildmindingDialog from '@/components/childminding/ChildmindingDialog';
import { PROGRAM_COLORS, getProgramLabel, calculateBilling } from '@/lib/childmindingConstants';

export default function ChildmindingSessionDetail({ session, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [intakeOpen, setIntakeOpen] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ['childminding-records', 'session', session?.id],
    queryFn: () => base44.entities.ChildmindingRecord.filter({ session_id: session.id }),
    enabled: !!session?.id,
  });

  if (!session) return null;

  const totalHours = records.reduce((s, r) => s + (r.hours || 0), 0);
  const pathwaysBilling = records
    .filter((r) => r.program === 'pathways')
    .reduce((s, r) => s + (r.billing_amount || calculateBilling(r.program, r.hours)), 0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['childminding-records'] });
  };

  return (
    <>
      <Dialog open={open && !intakeOpen} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{session.title || 'Childminding Session'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 text-xs text-muted-foreground -mt-1 flex-wrap">
            <span>{new Date(session.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            {session.start_time && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.start_time}{session.end_time ? `–${session.end_time}` : ''}</span>
            )}
            {session.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.location}</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Children</p>
              <p className="text-xl font-bold">{records.length}{session.capacity ? ` / ${session.capacity}` : ''}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Pathways Billing</p>
              <p className="text-xl font-bold">${pathwaysBilling.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Intake Records ({records.length})</h3>
            <Button size="sm" onClick={() => setIntakeOpen(true)}><Plus className="h-4 w-4" /> New Intake</Button>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No intake records yet. Click "+ New Intake" to add a child.</p>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-md border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Baby className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">{r.child_first_name} · {r.parent_name}</p>
                      <p className="text-xs text-muted-foreground">{r.hours}h · {getProgramLabel(r)}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (PROGRAM_COLORS[r.program] || '#64748b') + '20', color: PROGRAM_COLORS[r.program] || '#64748b' }}>{getProgramLabel(r)}</span>
                </div>
              ))}
            </div>
          )}

          {session.notes && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              {session.notes}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ChildmindingDialog
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        record={null}
        sessionId={session.id}
        presetDate={session.date}
        onSaved={() => { setIntakeOpen(false); refresh(); }}
      />
    </>
  );
}