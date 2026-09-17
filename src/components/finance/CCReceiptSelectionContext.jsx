import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CCReceiptSelectionContext = createContext(null);

// Shared selection of staff MasterCard receipts — receipts checked in the
// Staff MasterCard Receipts section, picked up when attaching them to a
// statement line item via "Add from Staff Receipts".
export function CCReceiptSelectionProvider({ children }) {
  const [selected, setSelected] = useState({}); // entry id -> CCReceiptEntry record

  const toggle = useCallback(entry => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[entry.id]) delete next[entry.id];
      else next[entry.id] = entry;
      return next;
    });
  }, []);

  const remove = useCallback(id => {
    setSelected(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ selected, toggle, remove }), [selected, toggle, remove]);
  return <CCReceiptSelectionContext.Provider value={value}>{children}</CCReceiptSelectionContext.Provider>;
}

export function useCCReceiptSelection() {
  const ctx = useContext(CCReceiptSelectionContext);
  if (!ctx) throw new Error('useCCReceiptSelection must be used within CCReceiptSelectionProvider');
  return ctx;
}