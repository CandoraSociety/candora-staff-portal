// The tablet screens that share the customer kiosk: the front desk tablet, and
// the classroom tablets Central Registration controls for ELL, EmpowerU and FRN.
export const RECEPTION_PROGRAM = 'reception';

export const KIOSK_PROGRAMS = [
  {
    id: 'central_registration',
    label: 'Central Registration',
    blurb: 'Front-desk registration for people signing up to any Candora program.',
  },
  {
    id: 'ell',
    label: 'ELL',
    blurb: 'English Language Learning classrooms — learners sign in and register at the wall tablet.',
  },
  {
    id: 'empoweru',
    label: 'EmpowerU',
    blurb: 'EmpowerU cohort classrooms — participants sign in and register at the wall tablet.',
  },
  {
    id: 'frn',
    label: 'FRN',
    blurb: 'Family Resource Network programs — caregivers sign in and register at the wall tablet.',
  },
];

export const ALL_KIOSK_PROGRAMS = [
  { id: RECEPTION_PROGRAM, label: 'Reception desk', blurb: 'Front-desk kiosk.' },
  ...KIOSK_PROGRAMS,
];

export const programInfo = (id) =>
  ALL_KIOSK_PROGRAMS.find((program) => program.id === (id || RECEPTION_PROGRAM)) || ALL_KIOSK_PROGRAMS[0];

export const programLabel = (id) => programInfo(id).label;

export const isProgramTablet = (station) => (station?.program || RECEPTION_PROGRAM) !== RECEPTION_PROGRAM;