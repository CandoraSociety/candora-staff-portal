// Test-client helpers for the Candora Central Database.
// A test client is identified purely by its name: the first name always starts
// with "Test" and the last name contains "Test".

export const TEST_CLIENT_BG = '#00e5ff'; // neon blue
export const TEST_CLIENT_TEXT = '#000000'; // bold black
export const TEST_CLIENT_MUTED = '#0a3d4d'; // readable dark text on neon blue

// A test client is identified by its name containing "Test" (in the first or
// last name) — covers "Testabc Xyztestson", "CaregiverTest Participant",
// "GeneralTest Client", etc.
export const isTestClient = (c) =>
  !!c &&
  ((c.first_name || '').toLowerCase().includes('test') ||
   (c.last_name || '').toLowerCase().includes('test'));

// Completely randomized name — first name always starts with "Test",
// last name always contains the word "Test".
export const generateTestClientName = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    first_name: 'Test' + cap(rand(5)),
    last_name: cap(rand(5)) + 'Testson',
  };
};