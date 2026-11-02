import { Clock } from 'lucide-react';
import { JLButton } from '@/components/joblab/ui';

export default function IdleSignOutDialog({ secondsLeft, onStay, onSignOut }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-jl-gold/25">
          <Clock className="h-5 w-5 text-jl-navy" />
        </div>
        <p className="jl-heading mt-3 text-lg font-semibold text-jl-fg">Still there?</p>
        <p className="mt-1 text-sm text-jl-muted-fg">
          We'll sign you out in <span className="font-semibold text-jl-fg">{secondsLeft}s</span> to keep your
          information private. Anything you've saved is already kept.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <JLButton size="lg" onClick={onStay}>
            Yes, keep me signed in
          </JLButton>
          <JLButton size="md" variant="outline" onClick={onSignOut}>
            Sign out now
          </JLButton>
        </div>
      </div>
    </div>
  );
}