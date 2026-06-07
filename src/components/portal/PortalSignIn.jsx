import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Clock, CheckCircle } from 'lucide-react';
import moment from 'moment';

export default function PortalSignIn() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('lookup'); // 'lookup' | 'action'
  const [foundVolunteer, setFoundVolunteer] = useState(null);
  const [activeLog, setActiveLog] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const queryClient = useQueryClient();

  const { data: positions = [] } = useQuery({
    queryKey: ['positions-portal'],
    queryFn: () => base44.entities.VolunteerPosition.filter({ status: 'open' }),
  });

  const handleLookup = async () => {
    setError('');
    setSuccessMsg('');
    if (!email.trim()) { setError('Please enter your email.'); return; }

    const volunteers = await base44.entities.Volunteer.filter({ email: email.trim().toLowerCase() });
    if (volunteers.length === 0) {
      setError('No volunteer found with that email address.');
      return;
    }

    const vol = volunteers[0];

    // Check PIN if set
    if (vol.pin_code && pin !== vol.pin_code) {
      setError('Incorrect PIN.');
      return;
    }

    if (vol.status === 'suspended') {
      setError('Your account is currently suspended. Please contact the coordinator.');
      return;
    }

    // Check for active sign-in
    const activeLogs = await base44.entities.VolunteerTimeLog.filter({ volunteer_id: vol.id, status: 'signed_in' });

    setFoundVolunteer(vol);
    setActiveLog(activeLogs[0] || null);
    setStep('action');
  };

  const signInMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      return base44.entities.VolunteerTimeLog.create({
        volunteer_id: foundVolunteer.id,
        volunteer_name: `${foundVolunteer.first_name} ${foundVolunteer.last_name}`,
        position_id: selectedPosition || 'general',
        position_title: selectedPosition
          ? (positions.find(p => p.id === selectedPosition)?.title || 'General')
          : 'General Volunteering',
        sign_in_time: now,
        date: moment().format('YYYY-MM-DD'),
        status: 'signed_in',
      });
    },
    onSuccess: () => {
      setSuccessMsg(`✓ Signed in successfully! Welcome, ${foundVolunteer.first_name}!`);
      setStep('lookup');
      setEmail(''); setPin(''); setFoundVolunteer(null); setSelectedPosition('');
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const signIn = moment(activeLog.sign_in_time);
      const signOut = moment(now);
      const hours = Math.round(signOut.diff(signIn, 'minutes') / 60 * 100) / 100;

      await base44.entities.VolunteerTimeLog.update(activeLog.id, {
        sign_out_time: now,
        total_hours: hours,
        status: 'completed',
      });

      // Update volunteer total_hours
      const newTotal = (foundVolunteer.total_hours || 0) + hours;
      await base44.entities.Volunteer.update(foundVolunteer.id, { total_hours: newTotal });
    },
    onSuccess: () => {
      setSuccessMsg(`✓ Signed out successfully! Thank you, ${foundVolunteer.first_name}!`);
      setStep('lookup');
      setEmail(''); setPin(''); setFoundVolunteer(null); setActiveLog(null);
    },
  });

  const reset = () => {
    setStep('lookup');
    setEmail(''); setPin(''); setFoundVolunteer(null); setActiveLog(null);
    setError(''); setSelectedPosition('');
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0">
      <CardHeader className="bg-[hsl(45,92%,53%)] rounded-t-lg text-center py-6">
        <CardTitle className="text-[hsl(230,60%,12%)] text-2xl font-display font-black flex items-center justify-center gap-2">
          <Clock className="w-6 h-6" />
          Volunteer Sign In / Out
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {step === 'lookup' && (
          <>
            <div>
              <Label className="text-foreground font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-foreground font-medium">PIN Code <span className="text-muted-foreground font-normal">(if assigned)</span></Label>
              <Input
                type="password"
                placeholder="Leave blank if no PIN"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}
            <Button
              className="w-full bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
              onClick={handleLookup}
            >
              Continue
            </Button>
          </>
        )}

        {step === 'action' && foundVolunteer && (
          <>
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[hsl(45,92%,53%)]/20 flex items-center justify-center mx-auto mb-2 text-2xl font-bold text-[hsl(230,65%,30%)]">
                {foundVolunteer.first_name?.[0]}{foundVolunteer.last_name?.[0]}
              </div>
              <h3 className="text-lg font-bold font-display">{foundVolunteer.first_name} {foundVolunteer.last_name}</h3>
              <Badge className="mt-1 bg-[hsl(230,40%,92%)] text-[hsl(230,50%,20%)]">{foundVolunteer.volunteer_type}</Badge>
            </div>

            {activeLog ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-800 font-medium text-sm">Currently signed in since</p>
                  <p className="text-amber-900 font-bold">{moment(activeLog.sign_in_time).format('h:mm A')}</p>
                  <p className="text-amber-700 text-xs">{activeLog.position_title}</p>
                </div>
                <Button
                  className="w-full bg-[hsl(230,65%,30%)] text-white hover:bg-[hsl(230,65%,25%)] font-semibold gap-2"
                  onClick={() => signOutMutation.mutate()}
                  disabled={signOutMutation.isPending}
                >
                  <LogOut className="w-4 h-4" />
                  {signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Position / Role</Label>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select position (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>General Volunteering</SelectItem>
                      {positions.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold gap-2"
                  onClick={() => signInMutation.mutate()}
                  disabled={signInMutation.isPending}
                >
                  <LogIn className="w-4 h-4" />
                  {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            )}

            <Button variant="ghost" className="w-full text-muted-foreground" onClick={reset}>
              ← Back
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}