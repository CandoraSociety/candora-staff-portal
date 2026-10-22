import { createContext, useContext, useMemo, useState } from 'react';

const TrainingTourContext = createContext({ revealedWidget: null, setRevealedWidget: () => {}, revealedNavPath: null, setRevealedNavPath: () => {} });

export default function TrainingTourProvider({ children }) {
  const [revealedWidget, setRevealedWidget] = useState(null);
  const [revealedNavPath, setRevealedNavPath] = useState(null);
  const value = useMemo(() => ({ revealedWidget, setRevealedWidget, revealedNavPath, setRevealedNavPath }), [revealedWidget, revealedNavPath]);
  return <TrainingTourContext.Provider value={value}>{children}</TrainingTourContext.Provider>;
}

export const useTrainingTour = () => useContext(TrainingTourContext);