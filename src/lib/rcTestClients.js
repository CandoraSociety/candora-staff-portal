// Test-client helpers for the Candora Central Database.
// A test client is identified purely by its name: the first name always starts
// with "Test" and the last name contains "Test".

export const TEST_CLIENT_BG = '#00e5ff'; // neon blue
export const TEST_CLIENT_TEXT = '#ffd700'; // sportscar yellow
export const TEST_CLIENT_MUTED = '#0a4a5c'; // readable dark text on neon blue

export const isTestClient = (c) =>
  !!c &&
  (c.first_name || '').trim().toLowerCase().startsWith('test') &&
  (c.last_name || '').toLowerCase().includes('test');

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