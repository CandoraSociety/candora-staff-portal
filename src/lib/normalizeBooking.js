export function normalizeBooking(b) {
  if (!b) return null;
  const d = b.data ? b.data : b;
  return { ...d, id: b.id || d.id, created_date: b.created_date || d.created_date };
}
export function normalizeBookings(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeBooking);
}