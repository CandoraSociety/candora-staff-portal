import { createContext, useContext, useMemo, useState } from 'react';

const TrainingTourContext = createContext({
  revealedWidget: null, setRevealedWidget: () => {},
  revealedNavPath: null, setRevealedNavPath: () => {},
  widgetsWalkthrough: false, setWidgetsWalkthrough: () => {},
  jumpRequest: null, requestJump: () => {},
});

export default function TrainingTourProvider({ children }) {
  const [revealedWidget, setRevealedWidget] = useState(null);
  const [revealedNavPath, setRevealedNavPath] = useState(null);
  // True while the Dashboard Widgets walkthrough highlights a specific widget
  // card — the Add Functions page then shows every card as it looks when the
  // widget is turned on, so learners see each widget at its best.
  const [widgetsWalkthrough, setWidgetsWalkthrough] = useState(false);
  // requestJump(moduleKey, stepIndex): ask the active tour to jump straight to
  // a step (used by the training sidebar). The token changes every call so
  // re-jumping to the same step still fires the tour's effect.
  const [jumpRequest, setJumpRequest] = useState(null);
  const requestJump = (moduleKey, stepIndex) => setJumpRequest({ moduleKey, stepIndex, token: Date.now() });
  const value = useMemo(
    () => ({ revealedWidget, setRevealedWidget, revealedNavPath, setRevealedNavPath, widgetsWalkthrough, setWidgetsWalkthrough, jumpRequest, requestJump }),
    [revealedWidget, revealedNavPath, widgetsWalkthrough, jumpRequest]
  );
  return <TrainingTourContext.Provider value={value}>{children}</TrainingTourContext.Provider>;
}

export const useTrainingTour = () => useContext(TrainingTourContext);