import React, { useState } from 'react';
import { ClipboardCheck, Loader2, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KioskFrame from '@/components/kiosk/KioskFrame';

// The class list for whoever is in the room: pick your own name and you are
// checked in. Anyone not on the list leaves their name and contact instead.
export default function KioskCheckInView({ prompt, people, loading, onCheckIn, onWalkIn, onClose }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [walkIn, setWalkIn] = useState({ first_name: '', last_name: '', contact: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const term = search.trim().toLowerCase();
  const shown = term ? (people || []).filter((person) => person.name.toLowerCase().includes(term)) : people || [];

  const pick = async (person) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onCheckIn({ participant_id: person.id });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not check you in. Please tell your facilitator.');
      setBusy(false);
    }
  };

  const submitWalkIn = async () => {
    if (busy) return;
    if (!walkIn.first_name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onWalkIn({
        first_name: walkIn.first_name.trim(),
        last_name: walkIn.last_name.trim(),
        contact: walkIn.contact.trim(),
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not check you in. Please tell your facilitator.');
      setBusy(false);
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={ClipboardCheck} onClose={onClose}>
      <div className="space-y-6">
        {!adding && (
          <>
            <div>
              <p className="text-2xl font-semibold">Find your name</p>
              <p className="text-muted-foreground">
                Touch it to mark yourself as here. {(prompt.checkins || []).length > 0}
                {(prompt.checkins || []).length > 0 ? ' already checked in.' : ''}
              </p>
            </div>

            {(people || []).length > 6 && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  className="h-14 pl-12 text-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your name"
                />
              </div>
            )}

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : shown.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                {(people || []).length === 0
                  ? 'Nobody is registered for this class yet.'
                  : 'No name matches that.'}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {shown.map((person) => {
                  const done = (prompt.checkins || []).some((row) => row.id === person.id);
                  return (
                    <Button
                      key={person.id}
                      variant={done ? 'secondary' : 'outline'}
                      disabled={busy || done}
                      onClick={() => pick(person)}
                      className="h-16 justify-start text-lg font-semibold"
                    >
                      {person.name}
                      {done && <span className="ml-auto text-sm font-medium text-success">Checked in</span>}
                    </Button>
                  );
                })}
              </div>
            )}

            <Button variant="ghost" className="w-full h-14 text-lg" onClick={() => { setAdding(true); setError(''); }}>
              <UserPlus className="h-5 w-5" /> I'm not on the list
            </Button>
          </>
        )}

        {adding && (
          <>
            <div>
              <p className="text-2xl font-semibold">Add your name</p>
              <p className="text-muted-foreground">Your facilitator will add you to the class.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-base">First name</Label>
                <Input
                  className="h-14 text-lg"
                  value={walkIn.first_name}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-base">Last name</Label>
                <Input
                  className="h-14 text-lg"
                  value={walkIn.last_name}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-base">Phone or email</Label>
                <Input
                  className="h-14 text-lg"
                  value={walkIn.contact}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, contact: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-14 flex-1 text-lg" onClick={() => { setAdding(false); setError(''); }}>
                Back to the list
              </Button>
              <Button className="h-14 flex-1 text-lg font-semibold" onClick={submitWalkIn} disabled={busy}>
                {busy ? 'Checking in…' : 'Check me in'}
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </KioskFrame>
  );
}