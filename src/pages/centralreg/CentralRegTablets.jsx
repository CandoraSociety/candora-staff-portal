import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Tablet } from 'lucide-react';
import RoomTabletCard from '@/components/centralreg/tablets/RoomTabletCard';
import RoomSectionHeader from '@/components/centralreg/tablets/RoomSectionHeader';
import ProgramSignInDialog from '@/components/centralreg/tablets/ProgramSignInDialog';
import KioskStationDialog from '@/components/reception/kiosk/KioskStationDialog';
import KioskClientVerificationDialog from '@/components/reception/kiosk/KioskClientVerificationDialog';
import { KIOSK_ROOMS, KIOSK_ROOM_IDS } from '@/lib/kioskPrograms';

// Classroom tablets, one per teaching room. A room's tablet opens its own
// check-in 30 minutes before anything starts in that room — whichever program
// the class belongs to — and closes it 10 minutes after the scheduled end.
export default function CentralRegTablets() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stationDialog, setStationDialog] = useState({ open: false, station: null, room: '' });
  const [sendTo, setSendTo] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const loadStations = useCallback(async () => {
    const rows = await base44.entities.KioskStation.list('-created_date', 100);
    setStations((rows || []).filter((row) => KIOSK_ROOM_IDS.includes(row.room)));
    setLoading(false);
  }, []);

  const loadPrompts = useCallback(async () => {
    const rows = await base44.entities.KioskPrompt.list('-created_date', 80);
    setPrompts(rows || []);
  }, []);

  // The classes staff can pick from when sending a form by hand. These lists are
  // only suggestions for the free-text class field, so each one is fetched on
  // its own: a list that can't be read (for example while a session is being
  // re-checked) is skipped instead of taking the whole page down.
  useEffect(() => {
    (async () => {
      const sources = [
        { entity: 'ELLClass', limit: 100, keep: () => true },
        { entity: 'EmpowerUCohort', limit: 50, keep: () => true },
        { entity: 'FRNProgram', limit: 100, keep: (row) => row.status !== 'completed' },
        { entity: 'PHACProgram', limit: 100, keep: (row) => row.status !== 'ended' },
      ];
      const settled = await Promise.allSettled(
        sources.map((source) => base44.entities[source.entity].list('-created_date', source.limit))
      );
      const names = settled.flatMap((result, index) => {
        if (result.status !== 'fulfilled') return [];
        return (result.value || []).filter(sources[index].keep).map((row) => row.name);
      }).filter(Boolean);
      setOptions([...new Set(names)].sort());
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

  const latestPromptFor = (stationId) => {
    const forStation = prompts.filter((prompt) => prompt.station_id === stationId && prompt.status !== 'dismissed');
    return forStation.find((prompt) => ['sent', 'opened'].includes(prompt.status)) || forStation[0] || null;
  };

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
          One tablet per room. Open <span className="font-mono">/kiosk</span> on a tablet once and type its code — after that it waits on the welcome screen. When anything is scheduled in that room, the tablet opens its check-in 30 minutes before the start and keeps it open until 10 minutes after the scheduled end, whichever program the class belongs to. The childminding room is the exception: it only ever follows the sessions booked in the Childminding portal, and a parent checking a child in stamps their arrival on that child's record.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">
          {KIOSK_ROOMS.map((room) => {
            const rows = stations.filter((station) => station.room === room.id);
            return (
              <section key={room.id} className="space-y-3">
                <RoomSectionHeader
                  room={room}
                  onAddTablet={() => setStationDialog({ open: true, station: null, room: room.id })}
                />

                {rows.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No {room.label} tablet yet. Add the one mounted in the room.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((station) => (
                      <RoomTabletCard
                        key={station.id}
                        station={station}
                        prompt={latestPromptFor(station.id)}
                        onSend={setSendTo}
                        onEdit={(row) => setStationDialog({ open: true, station: row, room: row.room || room.id })}
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
        program="classroom"
        room={stationDialog.room}
        onSaved={loadStations}
      />

      {sendTo && (
        <ProgramSignInDialog
          open={!!sendTo}
          onOpenChange={(open) => { if (!open) setSendTo(null); }}
          station={sendTo}
          options={options}
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