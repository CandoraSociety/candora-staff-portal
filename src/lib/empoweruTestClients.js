// Test-participant helpers for the EmpowerU portal.
// A test participant is identified purely by its name: the first name always
// starts with "Test" and the last name contains "Test".

export const TEST_PARTICIPANT_BG = '#00e5ff'; // neon blue
export const TEST_PARTICIPANT_TEXT = '#000000';
export const TEST_PARTICIPANT_MUTED = '#0a3d4d';

export const isTestParticipant = (p) =>
  !!p &&
  ((p.first_name || '').toLowerCase().includes('test') ||
   (p.last_name || '').toLowerCase().includes('test'));

// Completely randomized name — first name always starts with "Test",
// last name always contains the word "Test".
export const generateTestParticipantName = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    first_name: 'Test' + cap(rand(5)),
    last_name: cap(rand(5)) + 'Testson',
  };
};

// A full test participant profile with realistic sample data.
export const generateTestParticipantData = () => {
  const name = generateTestParticipantName();
  const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  return {
    ...name,
    date_of_birth: `19${70 + Math.floor(Math.random() * 25)}-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`,
    gender: 'female',
    marital_status: 'single',
    self_identification: 'na',
    citizenship: 'canadian_citizen',
    family_language: 'english',
    high_school_completed: 'yes',
    phone: `780-${digits(3)}-${digits(4)}`,
    email: `${name.first_name.toLowerCase()}.${name.last_name.toLowerCase()}@testmail.com`,
    address: `${100 + Math.floor(Math.random() * 900)} Test Street`,
    city: 'Edmonton',
    postal_code: `T${Math.floor(Math.random() * 6)}W ${digits(1)}A${digits(1)}`,
    emergency_contact: `Test Contact 780-${digits(3)}-${digits(4)}`,
    photo_consent: 'consent',
    learned_about_candora: 'website',
    notes: 'TEST RECORD — created for testing purposes. Safe to delete.',
  };
};