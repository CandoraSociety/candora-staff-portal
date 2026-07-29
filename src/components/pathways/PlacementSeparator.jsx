export default function PlacementSeparator({ label = "Placements" }) {
  return (
    <div className="my-6 select-none">
      <div className="relative px-36 py-1 text-center w-full">
        <div className="absolute inset-0 border border-black" />
        <div
          className="absolute inset-[2px]"
          style={{
            background: "#3a3a3a",
          }}
        />
        <span className="relative text-white text-xs font-display font-bold uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
    </div>
  );
}