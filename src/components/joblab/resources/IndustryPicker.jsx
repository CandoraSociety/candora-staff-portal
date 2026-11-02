import { cn } from '@/lib/utils';

// Second-level navigation for the By Industry tab.
export default function IndustryPicker({ tracks, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tracks.map((track) => (
        <button
          key={track.value}
          onClick={() => onChange(track.value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            value === track.value
              ? 'border-jl-primary bg-jl-primary text-jl-primary-fg'
              : 'border-jl-border bg-white text-jl-fg hover:bg-jl-secondary'
          )}
        >
          {track.label}
        </button>
      ))}
    </div>
  );
}