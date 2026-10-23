// Casey's WD journey runs through a work exposure placement with an external
// employer — shown here at the employer's workshop with her supervisor.
import { Head, Body, Arm, Leg } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-work { 0%,100% { transform: rotate(16deg); } 50% { transform: rotate(-20deg); } }
@keyframes dc-nod { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
.dc-work { animation: dc-work 0.7s ease-in-out infinite; }
.dc-nod { animation: dc-nod 1.4s ease-in-out infinite; }
`;

export default function CaseyScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* employer workshop */}
      <rect width="500" height="200" fill="hsl(220, 20%, 90%)" />
      <rect y="172" width="500" height="28" fill="hsl(220, 15%, 76%)" />
      {/* workbench + gear */}
      <rect x="310" y="118" width="170" height="12" rx="3" fill="#9c7a4f" />
      <rect x="322" y="130" width="9" height="46" fill="#7a5c3a" />
      <rect x="452" y="130" width="9" height="46" fill="#7a5c3a" />
      <rect x="342" y="106" width="28" height="12" rx="2" fill="#c94436" />
      <rect x="346" y="110" width="20" height="4" rx="2" fill="#8d2f26" />
      <path d="M420 118 a12 12 0 0 1 24 0 z" fill="#f5be19" />
      <path d="M452 118 a12 12 0 0 1 24 0 z" fill="#e8937c" />
      {/* crate Casey works on */}
      <rect x="286" y="138" width="44" height="34" rx="3" fill="#b08a5a" />
      {/* Casey — long hair, hi-vis vest */}
      <Leg x={232} y={148} len={30} fill="#7e6a3f" shoe="#5a4632" />
      <Leg x={250} y={148} len={30} fill="#7e6a3f" shoe="#5a4632" />
      <Body x={226} y={94} w={36} h={58} fill="#f5be19" />
      <rect x="226" y="104" width="36" height="5" fill="#8d99ae" />
      <rect x="226" y="130" width="36" height="5" fill="#8d99ae" />
      <Arm x={222} y={100} len={40} fill="#e0ab1d" skin="#b39ddb" tilt={10} origin="226px 104px" />
      <Arm x={258} y={100} len={40} fill="#e0ab1d" skin="#b39ddb" tilt={-22} className="dc-work" origin="262px 104px" />
      <Head cx={244} cy={80} r={13} skin="#b39ddb" hair="long" hairColor="#3a2a20" />
      {/* supervisor with clipboard */}
      <Leg x={384} y={146} len={30} fill="#2f3a56" shoe="#1f2740" />
      <Leg x={402} y={146} len={30} fill="#2f3a56" shoe="#1f2740" />
      <Body x={378} y={94} w={32} h={52} fill="#44598f" />
      <Arm x={374} y={100} len={38} fill="#3a4d7f" skin="#7fa4d9" tilt={16} origin="378px 104px" />
      <rect x="398" y="116" width="18" height="24" rx="2" fill="#ffffff" stroke="#8d99ae" strokeWidth="2" />
      <rect x="401" y="112" width="12" height="6" rx="2" fill="#8d99ae" />
      <g className="dc-nod" style={{ transformOrigin: "394px 82px" }}>
        <Head cx={394} cy={82} r={12} skin="#7fa4d9" hair="short" hairColor="#2b2b33" />
      </g>
    </svg>
  );
}