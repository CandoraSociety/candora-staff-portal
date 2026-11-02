import SpotlightTour from "@/components/training/SpotlightTour";
import { useMirroredSession } from "@/lib/training/liveMirror";
import { readFacilitatorSession } from "@/lib/training/facilitatorSession";

const keepProgress = async () => {};

// A participant's screen while a facilitator presents: the same slide, on the
// same portal page, without the facilitator's notes. It appears only for a
// live slide — practice, tests and quizzes release the screen again.
export default function TrainingMirror() {
  const { live, module, stepIndex } = useMirroredSession();
  if (!live || !module) return null;
  // Whoever is facilitating runs their own session, never a mirrored one.
  if (readFacilitatorSession()) return null;

  return (
    <SpotlightTour
      open
      mirror
      mirrorStep={stepIndex}
      module={module}
      progress={null}
      updateProgress={keepProgress}
      onClose={() => {}}
    />
  );
}