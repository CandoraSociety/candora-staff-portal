// Video-style scene for the "meet the demo client" slides. Each client gets a
// scene that matches where they actually are in their journey, and the slide's
// narration plays automatically alongside it (wired in SpotlightTour).
import JordanScene from "@/components/training/demoScene/JordanScene";
import SamScene from "@/components/training/demoScene/SamScene";
import CaseyScene from "@/components/training/demoScene/CaseyScene";

const CLIENTS = {
  jordan: { name: "Jordan Example", tag: "DEA pathway — Direct to Employment", Scene: JordanScene },
  sam: { name: "Sam Specimen", tag: "WD pathway — internal placement", Scene: SamScene },
  casey: { name: "Casey Sample", tag: "WD pathway — work exposure placement", Scene: CaseyScene },
};

export default function DemoClientScene({ client }) {
  const info = CLIENTS[client];
  if (!info) return null;
  const Scene = info.Scene;
  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-3 border" style={{ aspectRatio: "2.5 / 1", borderColor: "hsl(230, 50%, 22%)" }}>
      <style>{`@keyframes dc-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .dc-title { animation: dc-fade 0.7s ease 0.4s both; }`}</style>
      <Scene />
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