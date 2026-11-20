import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// One-off broadcast: emails every staff account the new sign-in link after the
// portal moved to a new address. Safe to run again — it simply resends.
function firstNameOf(user) {
  const raw = String(user.full_name || user.email || '').trim();
  const first = raw.split(/[\s._-]+/)[0] || '';
  if (!first) return 'there';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const listed = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const users = (Array.isArray(listed) ? listed : listed?.items || []).filter((u) => u.email);

    const sent = [];
    const failed = [];

    for (const user of users) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          template_name: 'StaffPortalLoginLink',
          variables: { first_name: firstNameOf(user) },
          category: 'transactional',
          from_name: 'Candora Society',
        });
        sent.push(user.email);
      } catch (error) {
        console.log(`Login link failed for ${user.email}:`, error.message);
        failed.push({ email: user.email, error: error.message });
      }
    }

    console.log(`Login links sent: ${sent.length}, failed: ${failed.length}`);
    return Response.json({ success: true, sent_count: sent.length, failed_count: failed.length, failed });
  } catch (error) {
    console.log('sendStaffLoginLinks failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});