// A short explainer video embedded inside a training tour card
// (step.video = url). Rendered with controls so the learner can play it
// whenever they're ready — browsers block audible autoplay anyway.
export default function TourVideo({ src }) {
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className="w-full rounded-lg mb-3 border"
      style={{ borderColor: "hsl(230, 50%, 22%)", aspectRatio: "16 / 9", background: "#000" }}
    >
      Your browser does not support video playback.
    </video>
  );
}