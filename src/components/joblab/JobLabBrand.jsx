import { cn } from '@/lib/utils';

// Candora's circle mark — the same asset the staff portal and printed documents use.
export const CANDORA_LOGO =
  'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

export function CandoraMark({ className }) {
  return (
    <img
      src={CANDORA_LOGO}
      alt="Candora Society"
      className={cn('rounded-full bg-white object-contain p-0.5 ring-1 ring-jl-gold/60', className || 'h-10 w-10')}
    />
  );
}

// Job Lab's lock-up. It carries the Candora mark and endorsement line, while the
// wordmark and the blue/gold palette keep it distinct from the staff portal.
export default function JobLabBrand({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <CandoraMark className="h-8 w-8" />
        <span className="jl-heading text-sm font-semibold text-jl-navy-fg">Job Lab</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <CandoraMark className="h-10 w-10" />
      <div>
        <p className="jl-heading text-sm font-semibold leading-tight text-jl-navy-fg">Job Lab</p>
        <p className="text-[11px] text-jl-gold/80">A Candora program</p>
      </div>
    </div>
  );
}