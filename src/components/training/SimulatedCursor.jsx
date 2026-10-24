import { createPortal } from "react-dom";

// A simulated pointer that plays the slide's action on the real page: as the
// narration describes each step, the cursor glides to the element being
// described and clicks it, so the tour watches like a hands-on video.
export default function SimulatedCursor({ x, y, visible, clicking }) {
  if (!visible || x == null || y == null) return null;
  return createPortal(
    <div
      aria-hidden="true"
      className="fixed z-[99] pointer-events-none"
      style={{
        left: x,
        top: y,
        transition:
          "left 0.9s cubic-bezier(0.45, 0, 0.2, 1), top 0.9s cubic-bezier(0.45, 0, 0.2, 1)",
      }}
    >
      <div className="relative">
        {clicking && (
          <span
            className="sim-cursor-click absolute rounded-full"
            style={{
              left: -16,
              top: -16,
              width: 40,
              height: 40,
              background: "hsl(45, 92%, 53% / 0.30)",
              border: "2px solid hsl(45, 92%, 53%)",
            }}
          />
        )}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(2, 6, 23, 0.55))",
            transform: clicking ? "scale(0.8)" : "scale(1)",
            transformOrigin: "top left",
            transition: "transform 0.12s ease-out",
          }}
        >
          <path
            d="M4 2 L4 19.5 L8.6 15.2 L11.4 21.5 L14.2 20.2 L11.4 14.2 L17.6 14.2 Z"
            fill="white"
            stroke="hsl(230, 70%, 16%)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>,
    document.body
  );
}