import { useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { isTestMode, setTestMode, isTrainingSessionActive } from '@/lib/testMode/sandbox';
import { cn } from '@/lib/utils';

// Small labelled toggle used in the top bar and the global tab bar so Test
// Mode can be flipped from anywhere. Toggling reloads the app so the data
// layer switches cleanly between real data and the in-memory sandbox.
// While a training session is active the switch is locked ON — training runs
// on simulated data, and flipping it off would drop a learner into the live
// portal without realizing it.
export function TestModeSwitch({ className }) {
  const training = isTrainingSessionActive();
  return (
    <label
      className={cn('flex items-center gap-2 select-none', training ? 'cursor-not-allowed opacity-60' : 'cursor-pointer', className)}
      title={training ? 'Test Mode stays on while training is in progress — exit training to turn it off' : undefined}
    >
      <FlaskConical className="w-4 h-4 shrink-0" />
      <span className="text-xs font-medium whitespace-nowrap">Test Mode</span>
      <Switch checked={isTestMode()} onCheckedChange={setTestMode} disabled={training} aria-label="Toggle Test Mode" />
    </label>
  );
}

// Faded red ribbon fixed at the top of every authenticated page while Test
// Mode is on. Clearly labels the session as simulated and carries its own
// exit toggle.
export function TestModeRibbon() {
  const on = isTestMode();

  useEffect(() => {
    if (!on) return undefined;
    document.body.classList.add('has-testmode');
    return () => document.body.classList.remove('has-testmode');
  }, [on]);

  if (!on) return null;

  return (
    <div className="global-testmode-ribbon fixed top-0 left-0 right-0 z-[80] h-9 flex items-center justify-center gap-2 bg-red-500/15 border-b-2 border-dashed border-red-400/70 px-4">
      <FlaskConical className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
        Test Mode
      </span>
      <span className="hidden md:inline text-[11px] text-red-700/80 whitespace-nowrap">
        Simulated data only — nothing you do here reaches the live portal
      </span>
      <label
        className={cn('ml-2 flex items-center gap-1.5 shrink-0', isTrainingSessionActive() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}
        title={isTrainingSessionActive() ? 'Test Mode stays on while training is in progress — exit training to turn it off' : undefined}
      >
        <span className="text-[11px] font-semibold text-red-700">Exit</span>
        <Switch checked onCheckedChange={setTestMode} disabled={isTrainingSessionActive()} aria-label="Exit Test Mode" />
      </label>
    </div>
  );
}