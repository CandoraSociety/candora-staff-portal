import React, { createContext, useContext } from 'react';

const ActingUserContext = createContext(null);

// Wraps a subtree so every useCurrentUser() call inside it reports this user
// instead of the signed-in one. Used by the Executive Director's test-employee
// tabs so the full submission forms work unchanged under a test identity.
export function ActingUserProvider({ user, children }) {
  return <ActingUserContext.Provider value={user}>{children}</ActingUserContext.Provider>;
}

export function useActingUser() {
  return useContext(ActingUserContext);
}