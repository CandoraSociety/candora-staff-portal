const audio = (name) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;

// "What we've learned" recap scenes for the Reception Simple Mode module.
export const RECEPTION_SIMPLE_RECAP_SCENES = {
  reception_simple: [
    {
      title: 'Four cards, one question each',
      audioUrl: audio('b1dde1ce5'),
      points: [
        'Appointments: someone who called ahead — book it, then check them in on arrival.',
        'Drop-Ins: someone standing in front of you — sign in on arrival, check out when they leave.',
        'Program Registration: the same records Central Registration uses, waitlists included.',
        'Resource Finder: describe the need, hand over the contact details before they leave.',
      ],
    },
    {
      title: 'A view, not a separate system',
      audioUrl: audio('bb1b64610'),
      points: [
        'The switch saves to your account; a supervisor keeps the full dashboard.',
        'Urgent Alert stays one press away, on the home page in simple mode.',
        'Client Visit, Staff Directory and the Urgent Alerts list stay in the full portal.',
        'Everything you save lands on the client file in the central client database.',
      ],
    },
  ],
};