import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { roomInfo, programLabel } from '@/lib/kioskPrograms';
import CheckInRosterList from '@/components/centralreg/tablets/CheckInRosterList';

const clockTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// The room's check-in list, opened from the QR code on the tablet screen. Staff
// only: they sign in once on their phone and this opens straight onto the list
// for however many classes they scan — no code to type, no pairing.
export default function RoomCheckIn() {
  const roomId = new URLSearchParams(window.location.search).get('room') || '';
  const room = roomInfo(roomId);

  const [station, setStation] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const stations = await base44.entities.KioskStation.filter(
      { room: roomId, is_active: true },
      '-created_date',
      5,
    );
    const found = (stations || [])[0] || null;
    setStation(found);
    if (!found) {
      setPrompt(null);
      setPeople([]);
      setLoading(false);
      return;
    }

    const open = await base44.entities.KioskPrompt.filter(
      { station_id: found.id, status: { $in: ['sent', 'opened'] } },
      '-created_date',
      1,
    );
    let live = (open || [])[0] || null;

    // If nothing is open yet, ask the same schedule the tablet uses — a class
    // that started while the wall tablet was asleep should still open here.
    if (!live) {
      const now = new Date();
      const res = await base44.functions.invoke('kioskApi', {
        action: 'poll',
        station_id: found.id,
        access_code: found.access_code,
        local_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        local_minutes: now.getHours() * 60 + now.getMinutes(),
      });
      live = res.data?.prompt || null;
    }
    setPrompt(live);

    if (live?.session_id) {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'roster',
        station_id: found.id,
        access_code: found.access_code,
        prompt_id: live.id,
      });
      setPeople(res.data?.people || []);
    } else {
      setPeople([]);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const markPresent = async (person) => {
    if (!station || !prompt) return;
    setBusyId(person.id);
    setError('');
    try {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'check_in',
        station_id: station.id,
        access_code: station.access_code,
        prompt_id: prompt.id,
        person: { participant_id: person.id },
        local_time: clockTime(),
      });
      if (res.data?.prompt) setPrompt(res.data.prompt);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not mark that person present.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
          <Link to="/central-registration/tablets">
            <ArrowLeft className="h-4 w-4" /> Tablets
          </Link>
        </Button>
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" /> {room?.label || 'Room'} check-in
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tap a name to mark that person present. Anything marked here shows on the room’s tablet too.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !station ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">No tablet is set up for {room?.label || 'this room'} yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add the tablet mounted in the room from the Tablets page.</p>
        </div>
      ) : !prompt ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Nothing is running in {room?.label || 'this room'} right now.</p>
          <p className="text-sm text-muted-foreground mt-1">
            The room’s tablet opens the check-in 30 minutes before a class starts.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <p className="text-lg font-semibold">{prompt.course_name || prompt.title}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              {programLabel(prompt.program)} · {(prompt.checkins || []).length} checked in
            </p>
          </div>

          {prompt.session_id ? (
            <CheckInRosterList
              people={people}
              checkins={prompt.checkins || []}
              busyId={busyId}
              onMark={markPresent}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              This is a sign-in form sent by hand, so there is no class list to tick off.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}