// Shared flat, faceless people for the demo-client training scenes.
// "Skin" uses soft fantasy tones (blues, greens, purples) — never realistic
// skin colours. Gender is signalled by silhouette only: hairstyle and clothing.
// Poses are simple and natural (arms relaxed at the sides); motion is kept to
// small, calm gestures so nothing reads wrong.

export const Head = ({ cx, cy, r, skin, hair, hairColor }) => {
  const cap = `M${cx - r} ${cy - r * 0.12} A${r * 1.04} ${r * 1.04} 0 0 1 ${cx + r} ${cy - r * 0.12} Z`;
  return (
    <g>
      {hair === "long" && (
        <rect x={cx - r - 2} y={cy - r - 1} width={2 * r + 4} height={2 * r + 8} rx={r} fill={hairColor} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={skin} />
      <path d={cap} fill={hairColor} />
    </g>
  );
};

// Standing person, faceless, arms relaxed. armL / armR = false hides a side
// arm so the scene can draw a natural pose (reaching along a counter, etc.)
// in its place via children. `nod` adds a calm, subtle head bob.
export const StandingPerson = ({ cx, floorY, skin, hair, hairColor, top, sleeve, legs, shoe, armL = true, armR = true, nod, children }) => {
  const headR = 12;
  const headCy = floorY - 74;
  const bodyX = cx - 15;
  const bodyY = headCy + headR - 2;
  const bodyH = floorY - 24 - bodyY;
  return (
    <g className={nod ? "dc-nod" : undefined}>
      <rect x={cx - 11} y={floorY - 24} width={9} height={24} rx={4.5} fill={legs} />
      <rect x={cx + 2} y={floorY - 24} width={9} height={24} rx={4.5} fill={legs} />
      <rect x={cx - 13} y={floorY - 5} width={13} height={6} rx={3} fill={shoe} />
      <rect x={cx + 1} y={floorY - 5} width={13} height={6} rx={3} fill={shoe} />
      <rect x={bodyX} y={bodyY} width={30} height={bodyH} rx={10} fill={top} />
      {armL && (
        <>
          <rect x={bodyX - 9} y={bodyY + 4} width={9} height={bodyH - 2} rx={4.5} fill={sleeve} />
          <circle cx={bodyX - 4.5} cy={bodyY + bodyH + 1} r={5} fill={skin} />
        </>
      )}
      {armR && (
        <>
          <rect x={bodyX + 30} y={bodyY + 4} width={9} height={bodyH - 2} rx={4.5} fill={sleeve} />
          <circle cx={bodyX + 34.5} cy={bodyY + bodyH + 1} r={5} fill={skin} />
        </>
      )}
      <Head cx={cx} cy={headCy} r={headR} skin={skin} hair={hair} hairColor={hairColor} />
      {children}
    </g>
  );
};