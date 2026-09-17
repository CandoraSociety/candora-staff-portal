import { parseISO, format } from 'date-fns';

// Reimbursement reference code — first initial of the staff member's first name,
// the first 4 letters of their last name, their sequential request number
// (per employee), and the date requested as DD-MM-YY.
// Example: Graham Currie, 3rd request ever, Sept 3 2026 → GCurr-3-03-09-26
export function buildReferenceCode({ fullName = '', sequence = 1, dateRequested }) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstInitial = (parts[0] || 'X').charAt(0).toUpperCase();
  const lastLetters = (parts.length > 1 ? parts[parts.length - 1] : '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 4);
  const lastPart = lastLetters
    ? lastLetters.charAt(0).toUpperCase() + lastLetters.slice(1).toLowerCase()
    : 'X';
  const d = dateRequested ? parseISO(dateRequested) : new Date();
  return `${firstInitial}${lastPart}-${sequence}-${format(d, 'dd-MM-yy')}`;
}