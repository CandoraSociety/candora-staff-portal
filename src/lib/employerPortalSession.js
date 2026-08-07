// Self-contained Employer Portal session (mirrors the volunteer portal pattern:
// no Base44 user account). The logged-in employer's id is kept in sessionStorage
// and verified against the Employer record on each guarded page.
const KEY = 'employer_portal_id';

export const getEmployerSession = () => {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
};

export const setEmployerSession = (id) => {
  try { sessionStorage.setItem(KEY, id); } catch {}
};

export const clearEmployerSession = () => {
  try { sessionStorage.removeItem(KEY); } catch {}
};