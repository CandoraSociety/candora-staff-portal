import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { publishPresentation } from "@/lib/training/presenter";

// Tells the presentation window what the room should be looking at: the page
// the facilitator is on, and which slide (if any) is on screen.
export default function usePresenterBroadcast({ moduleKey, stepIndex, stage, open }) {
  const location = useLocation();

  useEffect(() => {
    publishPresentation({
      module_key: moduleKey || null,
      step_index: stepIndex || 0,
      stage,
      open: !!open,
      path: `${location.pathname}${location.search}`,
    });
  }, [moduleKey, stepIndex, stage, open, location.pathname, location.search]);
}