// Staff who have the App Adjustments / Additions / Change Request button on
// their screen. Only these people submit requests, so only they receive the
// completion and clarification notifications on their Dashboard.
export const APP_ADJUSTMENT_EMAILS = [
  'luis.valbuena@candorasociety.com',
  'yazmin.escobar@candorasociety.com',
  'carla.bosse@candorasociety.com',
  'graham.currie@candorasociety.com',
];

export function hasAppAdjustmentsAccess(email) {
  return !!email && APP_ADJUSTMENT_EMAILS.includes(email.toLowerCase());
}