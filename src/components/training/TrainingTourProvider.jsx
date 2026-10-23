import { createContext, useContext, useMemo, useState } from 'react';

const TrainingTourContext = createContext({
  revealedWidget: null, setRevealedWidget: () => {},
  revealedNavPath: null, setRevealedNavPath: () => {},
  jumpRequest: null, requestJump: () => {},
});

export default function TrainingTourProvider({ children }) {
  const [revealedWidget, setRevealedWidget] = useState(null);
  const [revealedNavPath, setRevealedNavPath] = useState(null);
  // requestJump(moduleKey, stepIndex): ask the active tour to jump straight to
  // a step (used by the training sidebar). The token changes every call so
  // re-jumping to the same step still fires the tour's effect.
  const [jumpRequest, setJumpRequest] = useState(null);
  const requestJump = (moduleKey, stepIndex) => setJumpRequest({ moduleKey, stepIndex, token: Date.now() });
  const value = useMemo(
    () => ({ revealedWidget, setRevealedWidget, revealedNavPath, setRevealedNavPath, jumpRequest, requestJump }),
    [revealedWidget, revealedNavPath, jumpRequest]
  );
  return <TrainingTourContext.Provider value={value}>{children}</TrainingTourContext.Provider>;
}

export const useTrainingTour = () => useContext(TrainingTourContext);