// Jordan, already job-ready on the DEA pathway, works through his short action
// plan with his career counsellor: searching for work together at her desk.
import { Head, StandingPerson } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-tap { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
@keyframes dc-nod { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
@keyframes dc-pop { from { opacity: 0; transform: translateY(10px) scale(0.7); } to { opacity: 1; transform: none; } }
.dc-tap { animation: dc-tap 0.28s ease-in-out infinite; }
.dc-nod { animation: dc-nod 1.6s ease-in-out infinite; }
.dc-pop { animation: dc-pop 0.5s ease 0.6s both; transform-box: fill-box; transform-origin: center; }
`;

export default function JordanScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* office */}
      <rect width="500" height="200" fill="hsl(220, 35%, 93%)" />
      <rect y="175" width="500" height="25" fill="hsl(220, 20%, 82%)" />
      <rect x="36" y="30" width="92" height="60" rx="5" fill="#cfe0f4" stroke="#a8c0d8" strokeWidth="4" />
      <path d="M82 30 V90" stroke="#a8c0d8" strokeWidth="4" />
      <rect x="452" y="152" width="28" height="23" rx="3" fill="#b08a5a" />
      <ellipse cx="466" cy="141" rx="6" ry="12" fill="#7aa86a" />
      <ellipse cx="457" cy="137" rx="5" ry="10" fill="#8fbe7d" transform="rotate(-20 457 137)" />
      <ellipse cx="475" cy="137" rx="5" ry="10" fill="#8fbe7d" transform="rotate(20 475 137)" />
      {/* career counsellor — long hair, holding the client's file */}
      <StandingPerson cx={105} floorY={175} skin="#b49ae0" hair="long" hairColor="#4a3b63" top="#7a6ba8" sleeve="#6d5f9a" legs="#5b5470" shoe="#3a3348" nod>
        <rect x="93" y="128" width="24" height="30" rx="2" fill="#ffffff" stroke="#c9c2b8" strokeWidth="2" />
      </StandingPerson>
      {/* desk */}
      <rect x="150" y="126" width="230" height="11" rx="5" fill="#b08a5a" />
      <rect x="162" y="137" width="9" height="38" fill="#8a6b45" />
      <rect x="352" y="137" width="9" height="38" fill="#8a6b45" />
      {/* Jordan, seated behind the desk */}
      <rect x="330" y="96" width="36" height="34" rx="10" fill="#44598f" />
      <Head cx={348} cy={84} r={12} skin="#8fb3e3" hair="short" hairColor="#2f3a56" />
      {/* laptop with the job search on screen */}
      <rect x="248" y="92" width="66" height="34" rx="4" fill="#2f3a56" />
      <rect x="253" y="96" width="56" height="26" rx="2" fill="hsl(45, 92%, 60%)" />
      <rect x="258" y="100" width="30" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.8" />
      <rect x="258" y="107" width="44" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.6" />
      <rect x="258" y="114" width="36" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.4" />
      <rect x="240" y="126" width="82" height="7" rx="3" fill="#3a4d7f" />
      {/* Jordan's arm rests on the desk, hand typing on the keyboard */}
      <rect x="294" y="118" width="44" height="8" rx={4} fill="#3a4d7f" />
      <circle className="dc-tap" cx={300} cy={123} r={5} fill="#8fb3e3" />
      {/* speech bubble */}
      <g className="dc-pop">
        <rect x="150" y="26" width="128" height="42" rx="14" fill="#ffffff" stroke="hsl(230, 30%, 75%)" strokeWidth="2" />
        <path d="M168 66 L156 84 L182 66 Z" fill="#ffffff" stroke="hsl(230, 30%, 75%)" strokeWidth="2" />
        <circle cx="178" cy="47" r="4" fill="#7a6ba8" />
        <circle cx="192" cy="47" r="4" fill="#7a6ba8" />
        <circle cx="206" cy="47" r="4" fill="#7a6ba8" />
        <rect x="228" y="38" width="24" height="17" rx="3" fill="#44598f" />
        <rect x="234" y="33" width="12" height="7" rx="2" fill="none" stroke="#44598f" strokeWidth="2.5" />
      </g>
    </svg>
  );
}