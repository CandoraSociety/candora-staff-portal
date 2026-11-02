export const STAFF_LOGIN_URL = 'https://candora-staff-link.base44.app/login';

export function staffWelcomeMessage(employee) {
  return `Subject: Welcome to the Candora Staff Portal

Hi ${employee.first_name},

Welcome to the team! Your employee profile has been added to the Candora Staff Portal. An employee profile is separate from your sign-in account.

FIRST-TIME ACCESS
Open the app invitation email sent to ${employee.email}. If you have not received an invitation, ask your manager or HR to arrange one before you try to sign in.

Staff portal: ${STAFF_LOGIN_URL}

Use the same email address that was invited: ${employee.email}.

Choose Create one on the login page. Choose a password, create your account, and enter the newest 6-digit verification code sent to your email. If you already created your account, sign in instead of registering again.

RETURNING STAFF
Use the same staff portal link and the same sign-in method each time. This is the shared staff login link, not a personal invitation.

If access is restricted, ask your manager or HR to confirm that your exact email address has been invited.

Welcome aboard!
Candora HR Team`;
}