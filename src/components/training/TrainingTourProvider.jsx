import { createContext, useContext, useMemo, useState } from 'react';

const TrainingTourContext = createContext({ revealedWidget: null, setRevealedWidget: () => {} });

export default function TrainingTourProvider({ children }) {
  const [revealedWidget, setRevealedWidget] = useState(null);
  const value = useMemo(() => ({ revealedWidget, setRevealedWidget }), [revealedWidget]);
  return <TrainingTourContext.Provider value={value}>{children}</TrainingTourContext.Provider>;
}

export const useTrainingTour = () => useContext(TrainingTourContext);