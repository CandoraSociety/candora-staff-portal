import {
  programDateLine,
  programPlaceLine,
  programLink,
} from './websitePrograms.ts';

// Sends one program email, filling in the lines every one of them needs so the
// program, its time and its place always read the same as they do on the page.
// A refused email never fails the registration it belongs to — the record is what
// matters, and the failure is left in the logs.
export async function sendProgramEmail(base44, { template, to, program, session, registration, extra = {}, nextStep = '', ctaLabel = '' }) {
  const address = String(to || '').trim();
  if (!address) return;

  const variables = {
    first_name: String(registration?.full_name || '').trim().split(/\s+/)[0] || 'there',
    full_name: registration?.full_name || '',
    program_name: program?.name || 'Candora program',
    date_line: programDateLine(program, session),
    place_line: programPlaceLine(program),
    cost_line: program?.cost ? `Cost: ${program.cost}` : '',
    contact_line: [program?.contact_email, program?.contact_phone].filter(Boolean).join(' · '),
    next_step: nextStep,
    cta_url: programLink(program),
    cta_label: ctaLabel || 'View the program',
    ...extra,
  };

  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: address,
      template_name: template,
      category: 'transactional',
      variables,
    });
    if (result && result.success === false) {
      console.log('program email not sent', template, result.reason || result.message);
    }
  } catch (error) {
    console.log('program email failed', template, error?.message || error);
  }
}