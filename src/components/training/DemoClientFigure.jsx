// Faceless demo-client figure for the training "meet the client" scenes.
// Silhouette-only style: gender is signalled by hairstyle and clothing only,
// never by facial features (there is no face).
const SKIN = "#e9bd92";
const HAIR_M = "#23242b";
const HAIR_F = "#3a2a20";
const SHOE = "#1f2740";

export default function DemoClientFigure({ client }) {
  const isCasey = client === "casey";
  const torso = isCasey ? "#caa128" : client === "sam" ? "#2f7d6d" : "#44598f";
  const sleeve = isCasey ? "#b89023" : client === "sam" ? "#276a5c" : "#3a4d7f";
  const legs = isCasey ? "#7e6a3f" : "#2f3a56";

  return (
    <svg viewBox="0 0 120 210" className="block h-full w-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]">
      <g className="dc-bob">
        {/* legs — swing from the hips */}
        {isCasey ? (
          <>
            <g className="dc-leg-l" style={{ transformOrigin: "52px 126px" }}>
              <rect x="48" y="122" width="9" height="54" rx="4" fill={legs} />
              <rect x="45" y="174" width="15" height="7" rx="3" fill={SHOE} />
            </g>
            <g className="dc-leg-r" style={{ transformOrigin: "68px 126px" }}>
              <rect x="63" y="122" width="9" height="54" rx="4" fill={legs} />
              <rect x="60" y="174" width="15" height="7" rx="3" fill={SHOE} />
            </g>
            {/* dress covers the hips */}
            <path d="M44 50 h32 l12 76 h-56 z" fill={torso} />
          </>
        ) : (
          <>
            <g className="dc-leg-l" style={{ transformOrigin: "52px 112px" }}>
              <rect x="47" y="108" width="10" height="68" rx="5" fill={legs} />
              <rect x="44" y="172" width="17" height="8" rx="3" fill={SHOE} />
            </g>
            <g className="dc-leg-r" style={{ transformOrigin: "68px 112px" }}>
              <rect x="63" y="108" width="10" height="68" rx="5" fill={legs} />
              <rect x="59" y="172" width="17" height="8" rx="3" fill={SHOE} />
            </g>
            <rect x="42" y="50" width="36" height="64" rx="10" fill={torso} />
          </>
        )}

        {/* arms — swing from the shoulders; right hand carries the prop */}
        <g className="dc-arm-l" style={{ transformOrigin: "48px 56px" }}>
          <rect x="43" y="54" width="9" height="52" rx="4.5" fill={sleeve} />
          <circle cx="47.5" cy="108" r="5.5" fill={SKIN} />
        </g>
        <g className="dc-arm-r" style={{ transformOrigin: "72px 56px" }}>
          <rect x="68" y="54" width="9" height="52" rx="4.5" fill={sleeve} />
          <circle cx="72.5" cy="108" r="5.5" fill={SKIN} />
          {client === "jordan" && (
            <>
              <rect x="60" y="106" width="26" height="17" rx="3" fill="#8a6b45" />
              <rect x="67" y="100" width="12" height="7" rx="2" fill="none" stroke="#8a6b45" strokeWidth="2.5" />
            </>
          )}
          {isCasey && <rect x="64" y="100" width="17" height="23" rx="5" fill="#a1743f" />}
        </g>

        {/* gender cue: Sam's lanyard sits on the shirt */}
        {client === "sam" && (
          <>
            <path d="M57 50 L64 68" stroke="#f5be19" strokeWidth="2.5" fill="none" />
            <rect x="58" y="66" width="11" height="14" rx="2" fill="#f2eadb" />
          </>
        )}

        {/* neck + faceless head */}
        <rect x="55" y="42" width="10" height="9" fill={SKIN} />
        <circle cx="60" cy="30" r="15" fill={SKIN} />
        {isCasey ? (
          <>
            {/* longer hair: crown arc plus strands past the shoulders */}
            <path d="M45 30 a15 15 0 0 1 30 0" stroke={HAIR_F} strokeWidth="11" fill="none" strokeLinecap="round" />
            <rect x="40" y="24" width="7" height="36" rx="3.5" fill={HAIR_F} />
            <rect x="73" y="24" width="7" height="36" rx="3.5" fill={HAIR_F} />
          </>
        ) : (
          <path d="M45 30 a15 15 0 0 1 30 0" stroke={HAIR_M} strokeWidth="8" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}