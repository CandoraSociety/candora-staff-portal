// Sam's WD journey runs through an internal placement: real work experience
// inside Candora — shown here as his facility placement, mopping at the ARC.
import { Head, Body, Leg } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-sweep { 0%,100% { transform: rotate(10deg); } 50% { transform: rotate(-10deg); } }
.dc-sweep { animation: dc-sweep 1.6s ease-in-out infinite; }
`;

export default function SamScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* Candora interior */}
      <rect width="500" height="200" fill="hsl(220, 25%, 92%)" />
      <rect y="172" width="500" height="28" fill="#d9c6a8" />
      <rect x="150" y="30" width="200" height="46" rx="10" fill="hsl(230, 70%, 14%)" />
      <text x="250" y="60" textAnchor="middle" fontSize="22" fontWeight="800" letterSpacing="3" fill="#f5be19" fontFamily="sans-serif">CANDORA</text>
      <rect x="420" y="40" width="60" height="48" rx="5" fill="#cfe0f4" stroke="#a8c0d8" strokeWidth="4" />
      {/* Sam with his mop */}
      <Leg x={238} y={148} len={30} fill="#2f3a56" shoe="#1f2740" />
      <Leg x={256} y={148} len={30} fill="#2f3a56" shoe="#1f2740" />
      <Body x={232} y={94} w={36} h={58} fill="#2f7d6d" />
      <g className="dc-sweep" style={{ transformOrigin: "250px 108px" }}>
        <rect x="236" y="102" width="9" height="38" rx="4.5" fill="#276a5c" />
        <circle cx="240.5" cy="140" r="5" fill="#96c7a8" />
        <rect x="258" y="102" width="9" height="38" rx="4.5" fill="#276a5c" />
        <circle cx="262.5" cy="140" r="5" fill="#96c7a8" />
        <line x1="254" y1="118" x2="296" y2="170" stroke="#8a6b45" strokeWidth="5" strokeLinecap="round" />
        <rect x="280" y="164" width="42" height="10" rx="4" fill="#d9d3c3" />
      </g>
      <Head cx={250} cy={80} r={13} skin="#96c7a8" hair="short" hairColor="#33342e" />
      {/* bucket */}
      <path d="M164 152 h34 l-5 22 h-24 z" fill="#6fa8dc" />
      <rect x="162" y="148" width="38" height="7" rx="3.5" fill="#5a92c9" />
    </svg>
  );
}