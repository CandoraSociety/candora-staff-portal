import { base44 } from '@/api/base44Client';

/**
 * Best-effort StatusChange logger. Silently fails so a logging error
 * never blocks the primary workflow that called it.
 */
export async function logStatusChange({ client, change_type, change_date, from_value, to_value, notes, billing_relevant }) {
  try {
    const me = await base44.auth.me().catch(() => null);
    return await base44.entities.StatusChange.create({
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      change_type,
      change_date: change_date || new Date().toISOString().split('T')[0],
      from_value: from_value || null,
      to_value: to_value || null,
      notes: notes || null,
      logged_by: me?.email || null,
      logged_by_name: me?.full_name || null,
      billing_relevant: billing_relevant || false,
    });
  } catch (e) {
    // silent — logging is best-effort
  }
}