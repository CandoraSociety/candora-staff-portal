// Video-style animated scene for the "meet the demo client" training slides:
// a looping walking scene (parallax sky, skyline and road) with a faceless
// figure whose silhouette signals the client's gender. Plays automatically,
// like a short muted intro clip, beside the slide text.
import DemoClientFigure from "@/components/training/DemoClientFigure";

const CLIENTS = {
  jordan: { name: "Jordan Example", tag: "DEA road — Direct to Employment" },
  sam: { name: "Sam Specimen", tag: "WD road — internal placement" },
  casey: { name: "Casey Sample", tag: "WD road — work exposure placement" },
};

const CLOUDS = [
  { left: 6, top: 12, w: 52 },
  { left: 34, top: 6, w: 68 },
  { left: 58, top: 16, w: 42 },
  { left: 82, top: 9, w: 58 },
];
const BUILDINGS = [
  { w: 34, h: 46 }, { w: 22, h: 70 }, { w: 40, h: 38 }, { w: 28, h: 58 },
  { w: 18, h: 84 }, { w: 36, h: 44 }, { w: 24, h: 64 }, { w: 30, h: 36 },
];

const CSS = `
@keyframes dc-swingA { 0%,100% { transform: rotate(22deg); } 50% { transform: rotate(-22deg); } }
@keyframes dc-swingB { 0%,100% { transform: rotate(-22deg); } 50% { transform: rotate(22deg); } }
@keyframes dc-swingLA { 0%,100% { transform: rotate(28deg); } 50% { transform: rotate(-28deg); } }
@keyframes dc-swingLB { 0%,100% { transform: rotate(-28deg); } 50% { transform: rotate(28deg); } }
@keyframes dc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes dc-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes dc-road { from { background-position: 0 0; } to { background-position: -118px 0; } }
@keyframes dc-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dc-pulse { 0%,100% { box-shadow: 0 0 26px 6px hsl(45 92% 53% / 0.3); } 50% { box-shadow: 0 0 42px 12px hsl(45 92% 53% / 0.45); } }
.dc-arm-l { animation: dc-swingA 0.9s ease-in-out infinite; }
.dc-arm-r { animation: dc-swingB 0.9s ease-in-out infinite; }
.dc-leg-l { animation: dc-swingLB 0.9s ease-in-out infinite; }
.dc-leg-r { animation: dc-swingLA 0.9s ease-in-out infinite; }
.dc-bob { animation: dc-bob 0.9s ease-in-out infinite; }
.dc-skyline { animation: dc-scroll 11s linear infinite; }
.dc-clouds { animation: dc-scroll 40s linear infinite; }
.dc-road { animation: dc-road 0.8s linear infinite; background: repeating-linear-gradient(90deg, transparent 0 46px, hsl(45, 92%, 53%) 46px 76px); }
.dc-title { animation: dc-fade 0.7s ease 0.5s both; }
.dc-sun { animation: dc-pulse 5s ease-in-out infinite; }
`;

export default function DemoClientScene({ client }) {
  const info = CLIENTS[client];
  if (!info) return null;
  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-3 border" style={{ aspectRatio: "2.5 / 1", borderColor: "hsl(230, 50%, 22%)" }}>
      <style>{CSS}</style>
      {/* dusk sky */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(230, 65%, 16%), hsl(230, 55%, 30%))" }} />
      <div className="dc-sun absolute rounded-full" style={{ left: "12%", top: "13%", width: 34, height: 34, background: "hsl(45, 92%, 53%)" }} />
      {/* clouds — one strip duplicated so the loop is seamless */}
      <div className="dc-clouds absolute top-0 left-0 w-[200%] h-full">
        {[0, 100].map(offset => CLOUDS.map((c, i) => (
          <div key={`${offset}-${i}`} className="absolute rounded-full" style={{ left: `${c.left + offset}%`, top: `${c.top}%`, width: c.w, height: c.w * 0.32, background: "hsl(230, 40%, 70% / 0.25)" }} />
        )))}
      </div>
      {/* skyline */}
      <div className="dc-skyline absolute bottom-[24%] left-0 w-[200%] h-[36%] flex items-end">
        {[0, 100].map(offset => BUILDINGS.map((b, i) => (
          <div key={`${offset}-${i}`} className="shrink-0 rounded-t-sm" style={{ width: b.w, height: `${b.h}%`, marginRight: 6, background: "hsl(230, 45%, 20%)", boxShadow: "inset 0 6px 0 hsl(230, 45%, 24%)" }} />
        )))}
      </div>
      {/* road with moving dashes */}
      <div className="absolute bottom-0 left-0 right-0 h-[24%]" style={{ background: "hsl(230, 45%, 14%)" }}>
        <div className="dc-road absolute left-0 right-0" style={{ top: "46%", height: 4 }} />
      </div>
      {/* the client, walking */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 h-[62%]">
        <DemoClientFigure client={client} />
      </div>
      {/* lower-third title card */}
      <div className="dc-title absolute left-3 bottom-3 flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "hsl(230, 70%, 10% / 0.85)" }}>
        <span className="w-1.5 h-7 rounded-full" style={{ background: "hsl(45, 92%, 53%)" }} />
        <div>
          <div className="text-xs font-bold" style={{ color: "hsl(45, 92%, 65%)" }}>{info.name}</div>
          <div className="text-[10px]" style={{ color: "hsl(230, 30%, 75%)" }}>{info.tag}</div>
        </div>
      </div>
    </div>
  );
}