// The tablet screens that share the customer kiosk: the front desk tablet, and
// the classroom tablets Central Registration controls. Classroom tablets are
// assigned to a physical room, so their schedule is whatever is booked in it.
export const RECEPTION_PROGRAM = 'reception';
export const CLASSROOM_PROGRAM = 'classroom';

export const KIOSK_ROOMS = [
  {
    id: 'large_classroom',
    label: 'Large Classroom',
    blurb: 'The tablet by the door of the large classroom.',
  },
  {
    id: 'small_classroom',
    label: 'Small Classroom',
    blurb: 'The tablet by the door of the small classroom.',
  },
  {
    id: 'employment_classroom',
    label: 'Employment Classroom',
    blurb: 'The tablet in the employment classroom.',
  },
  {
    id: 'echo_valley',
    label: 'Echo Valley',
    blurb: 'The tablet in the Echo Valley space.',
  },
];

export const KIOSK_ROOM_IDS = KIOSK_ROOMS.map((room) => room.id);

export const roomInfo = (id) => KIOSK_ROOMS.find((room) => room.id === id) || null;

export const roomLabel = (id) => roomInfo(id)?.label || '';

const PROGRAM_LABELS = {
  reception: 'Reception desk',
  classroom: 'Classroom',
  central_registration: 'Central Registration',
  ell: 'ELL',
  empoweru: 'EmpowerU',
  frn: 'FRN',
  phac: 'PHAC',
  community: 'Community Programs',
  digilit: 'Digital Literacy',
  workshop: 'Workshops',
  other: 'Candora',
};

export const programInfo = (id) => ({ id: id || RECEPTION_PROGRAM, label: PROGRAM_LABELS[id] || 'Candora' });

export const programLabel = (id) => programInfo(id).label;