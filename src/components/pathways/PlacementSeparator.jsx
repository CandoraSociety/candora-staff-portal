export default function PlacementSeparator({ label = "Placements" }) {
  return (
    <div className="flex items-center gap-3 my-6 select-none">
      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-slate-400 rounded-full" />
      <div className="relative px-36 py-1.5 min-w-[600px] text-center">
        <div
          className="absolute inset-0 rounded-md"
          style={{
            background: "linear-gradient(135deg, hsl(231,64%,28%) 0%, hsl(231,64%,22%) 50%, hsl(44,80%,40%) 100%)",
          }}
        />
        <span className="relative text-white text-xs font-display font-bold uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
      <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-slate-300 to-slate-400 rounded-full" />
    </div>
  );
}