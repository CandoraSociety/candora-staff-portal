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

// Job Lab's lock-up: the Candora mark and name lead, with Job Lab as the program
// line underneath — navy and gold, the same identity the staff portal carries.
export default function JobLabBrand({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <CandoraMark className="h-8 w-8" />
        <span className="jl-heading text-sm font-bold leading-none text-jl-navy-fg">
          Candora <span className="font-medium text-jl-gold">Job Lab</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CandoraMark className="h-11 w-11" />
      <div>
        <p className="jl-heading text-[17px] font-bold leading-none tracking-tight text-jl-navy-fg">Candora</p>
        <p className="mt-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.22em] text-jl-gold">Job Lab</p>
      </div>
    </div>
  );
}