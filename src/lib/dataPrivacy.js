// One source of truth for how Candora 360 tells people where their information
// goes. Every form that collects personal details uses this wording, so the
// promise is identical wherever a client, family or supporter meets it.

export const PRIVACY_CONTACT_EMAIL = 'info@candorasociety.com';

// The sentence shown under a form, above the submit button.
export const DATA_STORAGE_NOTE =
  'What you enter is saved in Candora 360’s secure database, which is hosted by Base44 — the platform this service is built on — and kept in the United States. It is encrypted while stored and while being sent, and only authorized Candora staff can see it.';

// The acknowledgement someone ticks before submitting personal details.
export const DATA_STORAGE_ACK =
  'I understand that the information I submit is stored by Base44, the third-party platform that hosts Candora 360. That data is kept in the United States, is encrypted in transit and at rest, and can be accessed by authorized Candora staff and, when needed for support or security, by Base44. It is used only to provide this service, and I can ask to see, correct or delete it by emailing ' +
  PRIVACY_CONTACT_EMAIL +
  '.';

// Shorter line for places that only take a name and a payment (giving pages).
export const DONATION_STORAGE_NOTE =
  'Card details go straight to Stripe and never reach us. The name, email and gift details you give are stored in Candora 360’s secure database, hosted by Base44 and kept in the United States.';