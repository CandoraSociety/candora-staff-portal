import DemoSceneIllustration from "@/components/training/demoScene/DemoSceneIllustration";

const CLIENTS = {
  jordan: {
    name: "Jordan Example", tag: "DEA pathway — Direct to Employment",
    image: "https://media.base44.com/images/public/6a249282cb496579542673b7/2aeed2863_generated_0435310b.jpg",
    alt: "Faceless blue Jordan and his lavender career counsellor seated facing each other, working together at a laptop in a bright office.",
  },
  sam: {
    name: "Sam Specimen", tag: "WD pathway — internal placement",
    image: "https://media.base44.com/images/public/6a249282cb496579542673b7/72fa6cd22_generated_eef29630.jpg",
    alt: "Faceless green Sam practicing workplace skills at a reception counter while his lavender supervisor reviews a checklist.",
  },
  casey: {
    name: "Casey Sample", tag: "WD pathway — work exposure placement",
    image: "https://media.base44.com/images/public/6a249282cb496579542673b7/49ffde801_generated_9a72d789.jpg",
    alt: "Faceless lavender Casey in a yellow safety vest preparing a parcel with her blue workplace supervisor at a packing bench.",
  },
};

export default function DemoClientScene({ client, playing }) {
  const info = CLIENTS[client];
  if (!info) return null;
  return (
    <figure className="relative mb-3 aspect-[2.5/1] w-full overflow-hidden rounded-xl border border-border bg-muted">
      <DemoSceneIllustration key={client} src={info.image} alt={info.alt} playing={playing} />
      <figcaption className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-sidebar/95 px-3 py-1.5">
        <span className="h-7 w-1.5 shrink-0 rounded-full bg-primary" />
        <div>
          <div className="text-xs font-bold text-primary">{info.name}</div>
          <div className="text-[10px] text-sidebar-foreground">{info.tag}</div>
        </div>
      </figcaption>
    </figure>
  );
}