import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Tablet } from 'lucide-react';
import ProgramTabletCard from '@/components/centralreg/tablets/ProgramTabletCard';
import ProgramSectionHeader from '@/components/centralreg/tablets/ProgramSectionHeader';
import ProgramSignInDialog from '@/components/centralreg/tablets/ProgramSignInDialog';
import KioskStationDialog from '@/components/reception/kiosk/KioskStationDialog';
import KioskClientVerificationDialog from '@/components/reception/kiosk/KioskClientVerificationDialog';
import { KIOSK_PROGRAMS } from '@/lib/kioskPrograms';

// Classroom tablets for ELL, EmpowerU and FRN. Each wall-mounted tablet shows the
// sign-in form sent from here, and whatever the person types comes back to be
// checked before it becomes a client file.
const CLASSROOM_PROGRAMS = KIOSK_PROGRAMS.map((program) => program.id);

export default function CentralRegTablets() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [options, setOptions] = useState({ ell: [], empoweru: [], frn: [] });
  const [picked, setPicked] = useState({});
  const [loading, setLoading] = useState(true);

  const [stationDialog, setStationDialog] = useState({ open: false, station: null, program: 'ell' });
  const [sendTo, setSendTo] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const loadStations = useCallback(async () => {
    const rows = await base44.entities.KioskStation.list('-created_date', 100);
    setStations((rows || []).filter((row) => CLASSROOM_PROGRAMS.includes(row.program)));
    setLoading(false);
  }, []);

  const loadPrompts = useCallback(async () => {
    const rows = await base44.entities.KioskPrompt.list('-created_date', 80);
    setPrompts((rows || []).filter((row) => CLASSROOM_PROGRAMS.includes(row.program)));
  }, []);

  // The programs and classes inside each group, so staff pick one instead of typing it.
  useEffect(() => {
    (async () => {
      const [classes, cohorts, programs] = await Promise.all([
        base44.entities.ELLClass.list('-created_date', 100),
        base44.entities.EmpowerUCohort.list('-created_date', 50),
        base44.entities.FRNProgram.list('-created_date', 100),
      ]);
      const uniqueNames = (rows) => [...new Set((rows || []).map((row) => row.name).filter(Boolean))];
      setOptions({
        ell: uniqueNames(classes),
        empoweru: uniqueNames(cohorts),
        frn: uniqueNames((programs || []).filter((row) => row.status !== 'completed')),
      });
    })();
  }, []);

  useEffect(() => {
    loadStations();
    loadPrompts();
  }, [loadStations, loadPrompts]);

  useEffect(() => base44.entities.KioskPrompt.subscribe(() => loadPrompts()), [loadPrompts]);

  useEffect(() => {
    const interval = setInterval(loadStations, 30000);
    return () => clearInterval(interval);
  }, [loadStations]);

  const latestPromptFor = (stationId) =>
    prompts.find((prompt) => prompt.station_id === stationId && prompt.status !== 'dismissed') || null;

  const clearPrompt = async (prompt) => {
    await base44.entities.KioskPrompt.update(prompt.id, { status: 'dismissed' });
    loadPrompts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <Tablet className="h-6 w-6 text-primary" /> Classroom Tablets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wall-mounted tablets in the classrooms. Open <span className="font-mono">/kiosk</span> on a tablet once and type its code — after that it waits on the welcome screen and shows the sign-in form you send it.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">
          {KIOSK_PROGRAMS.map((program) => {
            const rows = stations.filter((station) => station.program === program.id);
            return (
              <section key={program.id} className="space-y-3">
                <ProgramSectionHeader
                  program={program}
                  options={options[program.id] || []}
                  selected={picked[program.id] || ''}
                  onSelect={(value) => setPicked((prev) => ({ ...prev, [program.id]: value }))}
                  onAddTablet={() => setStationDialog({ open: true, station: null, program: program.id })}
                />

                {rows.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No {program.label} tablet yet. Add the one mounted in the classroom.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((station) => (
                      <ProgramTabletCard
                        key={station.id}
                        station={station}
                        prompt={latestPromptFor(station.id)}
                        onSend={setSendTo}
                        onEdit={(row) => setStationDialog({ open: true, station: row, program: row.program || program.id })}
                        onClear={clearPrompt}
                        onVerify={setVerifying}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <KioskStationDialog
        open={stationDialog.open}
        onOpenChange={(open) => setStationDialog((prev) => ({ ...prev, open }))}
        station={stationDialog.station}
        program={stationDialog.program}
        onSaved={loadStations}
      />

      {sendTo && (
        <ProgramSignInDialog
          open={!!sendTo}
          onOpenChange={(open) => { if (!open) setSendTo(null); }}
          station={sendTo}
          options={options[sendTo.program] || []}
          defaultCourse={picked[sendTo.program] || ''}
          sentByName={user?.full_name}
          onSent={loadPrompts}
        />
      )}

      <KioskClientVerificationDialog
        open={!!verifying}
        prompt={verifying}
        onOpenChange={(open) => { if (!open) setVerifying(null); }}
        onSaved={loadPrompts}
      />
    </div>
  );
}