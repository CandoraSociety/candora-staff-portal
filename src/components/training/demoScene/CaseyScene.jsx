// Casey's WD journey runs through a work exposure placement with an external
// employer — shown here at the employer's workshop with her supervisor.
import { StandingPerson } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-sand { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
@keyframes dc-nod { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
.dc-sand { animation: dc-sand 0.6s ease-in-out infinite; }
.dc-nod { animation: dc-nod 1.6s ease-in-out infinite; }
`;

export default function CaseyScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* employer workshop */}
      <rect width="500" height="200" fill="hsl(220, 20%, 90%)" />
      <rect y="175" width="500" height="25" fill="hsl(220, 15%, 76%)" />
      {/* workbench + gear */}
      <rect x="310" y="126" width="170" height="11" rx="3" fill="#9c7a4f" />
      <rect x="322" y="137" width="9" height="38" fill="#7a5c3a" />
      <rect x="452" y="137" width="9" height="38" fill="#7a5c3a" />
      <rect x="342" y="114" width="28" height="12" rx="2" fill="#c94436" />
      <rect x="346" y="118" width="20" height="4" rx="2" fill="#8d2f26" />
      <path d="M420 126 a12 12 0 0 1 24 0 z" fill="#f5be19" />
      <path d="M452 126 a12 12 0 0 1 24 0 z" fill="#e8937c" />
      {/* crate Casey works on */}
      <rect x="244" y="140" width="46" height="35" rx="3" fill="#b08a5a" />
      {/* Casey — long hair, hi-vis vest */}
      <StandingPerson cx={215} floorY={175} skin="#b39ddb" hair="long" hairColor="#3a2a20" top="#f5be19" sleeve="#e0ab1d" legs="#7e6a3f" shoe="#5a4632" armR={false}>
        {/* hi-vis stripes */}
        <rect x="200" y="120" width="30" height="5" fill="#8d99ae" />
        <rect x="200" y="136" width="30" height="5" fill="#8d99ae" />
        {/* forearm angled down onto the crate */}
        <g transform="rotate(-32 228 116)">
          <rect x="224" y="112" width="9" height="44" rx="4.5" fill="#e0ab1d" />
        </g>
        {/* hand and sander, working */}
        <g className="dc-sand">
          <circle cx="250" cy="150" r={5} fill="#b39ddb" />
          <rect x="244" y="146" width="14" height="8" rx="3" fill="#8d99ae" />
        </g>
      </StandingPerson>
      {/* supervisor with clipboard */}
      <StandingPerson cx={408} floorY={175} skin="#7fa4d9" hair="short" hairColor="#2b2b33" top="#44598f" sleeve="#3a4d7f" legs="#2f3a56" shoe="#1f2740" nod>
        <rect x="398" y="124" width="18" height="24" rx="2" fill="#ffffff" stroke="#8d99ae" strokeWidth="2" />
        <rect x="401" y="120" width="12" height="6" rx="2" fill="#8d99ae" />
      </StandingPerson>
    </svg>
  );
}