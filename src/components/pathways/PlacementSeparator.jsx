export default function PlacementSeparator({ label = "Placements" }) {
  return (
    <div className="my-6 select-none">
      <div className="relative px-36 py-2 text-center w-full">
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
    </div>
  );
}