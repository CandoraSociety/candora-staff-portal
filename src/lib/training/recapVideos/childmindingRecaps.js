const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

// "What we've learned" recap scenes for the Childminding module.
export const CHILDMINDING_RECAP_SCENES = {
  childminding: [
    {
      title: 'A session comes first',
      audioUrl: audio('0327c5f8b'),
      points: [
        'A session holds the date, the times, the location and the capacity in children.',
        'Sessions are normally created ahead of time by the program assistant.',
        'Capacity counts every program in the room that morning, not one program.',
        'Opening a session shows the children in it, the total hours and its Pathways billing.',
      ],
    },
    {
      title: 'Signing in and out',
      audioUrl: audio('595bc1967'),
      points: [
        'Each visit is one intake record: child, parent or guardian, date, check-in and check-out.',
        'Hours are calculated from the times and rounded up to the next fifteen minutes.',
        'Pathways bills twenty dollars a child per hour; ELL and other programs are not charged.',
        'A record with no check-out is a child with no hours and a bill nobody can send.',
      ],
    },
    {
      title: 'Two habits worth keeping',
      audioUrl: audio('b508af414'),
      points: [
        'Sign the child in when they arrive — the check-in time is the record.',
        'Sign them out at pickup, before they walk out of the room.',
      ],
    },
  ],
};