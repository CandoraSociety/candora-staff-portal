// Sam's WD journey runs through an internal placement: real work experience
// inside Candora — shown here as his facility placement, wiping down the counter.
import { StandingPerson } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-wipe { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
@keyframes dc-nod { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
.dc-wipe { animation: dc-wipe 0.9s ease-in-out infinite; }
.dc-nod { animation: dc-nod 1.6s ease-in-out infinite; }
`;

export default function SamScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* Candora interior */}
      <rect width="500" height="200" fill="hsl(220, 25%, 92%)" />
      <rect y="175" width="500" height="25" fill="#d9c6a8" />
      <rect x="150" y="30" width="200" height="46" rx="10" fill="hsl(230, 70%, 14%)" />
      <text x="250" y="60" textAnchor="middle" fontSize="22" fontWeight="800" letterSpacing="3" fill="#f5be19" fontFamily="sans-serif">CANDORA</text>
      <rect x="420" y="40" width="60" height="48" rx="5" fill="#cfe0f4" stroke="#a8c0d8" strokeWidth="4" />
      {/* counter */}
      <rect x="300" y="128" width="150" height="11" rx="5" fill="#b08a5a" />
      <rect x="312" y="139" width="9" height="36" fill="#8a6b45" />
      <rect x="428" y="139" width="9" height="36" fill="#8a6b45" />
      {/* Sam, wiping the counter */}
      <StandingPerson cx={248} floorY={175} skin="#96c7a8" hair="short" hairColor="#33342e" top="#2f7d6d" sleeve="#276a5c" legs="#2f3a56" shoe="#1f2740" armR={false} nod>
        {/* arm resting along the counter */}
        <rect x="258" y="120" width="44" height="9" rx="4.5" fill="#276a5c" />
        {/* hand and cloth, wiping */}
        <g className="dc-wipe">
          <circle cx="302" cy="124" r={5} fill="#96c7a8" />
          <rect x="298" y="128" width="18" height="7" rx="3" fill="#d9d3c3" />
        </g>
      </StandingPerson>
      {/* bucket */}
      <path d="M60 156 h34 l-5 19 h-24 z" fill="#6fa8dc" />
      <rect x="58" y="152" width="38" height="7" rx="3.5" fill="#5a92c9" />
    </svg>
  );
}