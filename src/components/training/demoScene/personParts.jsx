// Shared flat, faceless body parts for the demo-client training scenes.
// "Skin" uses soft fantasy tones (blues, greens, purples) — never realistic
// skin colours. Gender is signalled by silhouette only: hairstyle and clothing.

export const Head = ({ cx, cy, r, skin, hair, hairColor }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={skin} />
    {hair === "long" ? (
      <>
        <path d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${2 * r} 0`} stroke={hairColor} strokeWidth={r * 0.75} fill="none" strokeLinecap="round" />
        <rect x={cx - r - r * 0.25} y={cy - r * 0.3} width={r * 0.55} height={r * 2} rx={r * 0.27} fill={hairColor} />
        <rect x={cx + r - r * 0.3} y={cy - r * 0.3} width={r * 0.55} height={r * 2} rx={r * 0.27} fill={hairColor} />
      </>
    ) : (
      <path d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${2 * r} 0`} stroke={hairColor} strokeWidth={r * 0.55} fill="none" strokeLinecap="round" />
    )}
  </g>
);

export const Body = ({ x, y, w, h, fill }) => (
  <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.3} fill={fill} />
);

// Static tilt on the outer group; the animation class (if given) swings the arm.
export const Arm = ({ x, y, len, fill, skin, className, origin, tilt }) => (
  <g style={tilt ? { transform: `rotate(${tilt})`, transformOrigin: origin } : undefined}>
    <g className={className} style={{ transformOrigin: origin }}>
      <rect x={x} y={y} width={9} height={len} rx={4.5} fill={fill} />
      <circle cx={x + 4.5} cy={y + len} r={5} fill={skin} />
    </g>
  </g>
);

export const Leg = ({ x, y, len, fill, shoe }) => (
  <g>
    <rect x={x} y={y} width={9} height={len} rx={4.5} fill={fill} />
    <rect x={x - 3} y={y + len} width={15} height={7} rx={3} fill={shoe} />
  </g>
);