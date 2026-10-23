// Jordan, already job-ready on the DEA pathway, works through his short action
// plan with his career counsellor: searching for work together at her desk.
import { Head, Body, Arm, Leg } from "@/components/training/demoScene/personParts";

const CSS = `
@keyframes dc-type { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(-6deg); } }
@keyframes dc-gest { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(10deg); } }
@keyframes dc-pop { from { opacity: 0; transform: translateY(10px) scale(0.7); } to { opacity: 1; transform: none; } }
.dc-type { animation: dc-type 0.32s ease-in-out infinite; }
.dc-gest { animation: dc-gest 1.5s ease-in-out infinite; }
.dc-pop { animation: dc-pop 0.5s ease 0.6s both; transform-box: fill-box; transform-origin: center; }
`;

export default function JordanScene() {
  return (
    <svg viewBox="0 0 500 200" className="block h-full w-full">
      <style>{CSS}</style>
      {/* office */}
      <rect width="500" height="200" fill="hsl(220, 35%, 93%)" />
      <rect y="172" width="500" height="28" fill="hsl(220, 20%, 82%)" />
      <rect x="36" y="30" width="92" height="60" rx="5" fill="#cfe0f4" stroke="#a8c0d8" strokeWidth="4" />
      <path d="M82 30 V90" stroke="#a8c0d8" strokeWidth="4" />
      <rect x="452" y="152" width="28" height="22" rx="3" fill="#b08a5a" />
      <ellipse cx="466" cy="142" rx="6" ry="12" fill="#7aa86a" />
      <ellipse cx="457" cy="138" rx="5" ry="10" fill="#8fbe7d" transform="rotate(-20 457 138)" />
      <ellipse cx="475" cy="138" rx="5" ry="10" fill="#8fbe7d" transform="rotate(20 475 138)" />
      {/* career counsellor — long hair, gesturing */}
      <Leg x={94} y={148} len={30} fill="#5b5470" shoe="#3a3348" />
      <Leg x={112} y={148} len={30} fill="#5b5470" shoe="#3a3348" />
      <Body x={87} y={94} w={36} h={58} fill="#7a6ba8" />
      <Arm x={83} y={100} len={42} fill="#6d5f9a" skin="#b49ae0" tilt={8} origin="87px 104px" />
      <Arm x={115} y={100} len={42} fill="#6d5f9a" skin="#b49ae0" tilt={-14} className="dc-gest" origin="119px 104px" />
      <Head cx={105} cy={80} r={13} skin="#b49ae0" hair="long" hairColor="#4a3b63" />
      {/* Jordan, seated on the right */}
      <Body x={352} y={98} w={38} h={46} fill="#44598f" />
      <Head cx={371} cy={86} r={13} skin="#8fb3e3" hair="short" hairColor="#2f3a56" />
      {/* desk */}
      <rect x="150" y="120" width="230" height="12" rx="5" fill="#b08a5a" />
      <rect x="162" y="132" width="9" height="42" fill="#8a6b45" />
      <rect x="352" y="132" width="9" height="42" fill="#8a6b45" />
      {/* laptop with the job search on screen */}
      <rect x="248" y="86" width="66" height="36" rx="4" fill="#2f3a56" />
      <rect x="253" y="90" width="56" height="28" rx="2" fill="hsl(45, 92%, 60%)" />
      <rect x="258" y="94" width="30" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.8" />
      <rect x="258" y="102" width="44" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.6" />
      <rect x="258" y="110" width="36" height="4" rx="2" fill="hsl(230, 70%, 14%)" opacity="0.4" />
      <rect x="240" y="121" width="82" height="6" rx="3" fill="#3a4d7f" />
      {/* Jordan typing */}
      <Arm x={358} y={102} len={26} fill="#3a4d7f" skin="#8fb3e3" tilt={-28} className="dc-type" origin="362px 106px" />
      <Arm x={344} y={102} len={24} fill="#3a4d7f" skin="#8fb3e3" tilt={16} origin="348px 106px" />
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