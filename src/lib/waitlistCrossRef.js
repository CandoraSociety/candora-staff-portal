import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Cross-program waitlist index — a light, current snapshot of EVERYONE on any
// program waitlist, used to show "also waitlisted for…" indicators on waitlist
// profiles and on central database client files. One cached query serves all
// consumers; matching is by email, phone or full name.

const AREA_DEFS = [
  {
    area: 'ell', label: 'ELL', color: '#22c55e',
    load: () => base44.entities.ELLLearner.filter({ enrollment_status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: `${r.first_name || ''} ${r.last_name || ''}`.trim(), phone: r.phone, email: r.email }),
  },
  {
    area: 'empoweru', label: 'EmpowerU', color: '#8b5cf6',
    load: () => base44.entities.EmpowerURegistration.filter({ status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: r.participant_name, phone: null, email: null }),
  },
  {
    area: 'digilit', label: 'Digital Literacy', color: '#6366f1',
    load: () => base44.entities.DigiLitParticipant.filter({ status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: `${r.first_name || ''} ${r.last_name || ''}`.trim(), phone: r.phone, email: r.email }),
  },
  {
    area: 'community', label: 'Community Programs', color: '#f97316',
    load: () => base44.entities.CommunityRegistration.filter({ status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: r.participant_name, phone: null, email: null }),
  },
  {
    area: 'phac', label: 'PHAC (0-6)', color: '#0ea5e9',
    load: () => base44.entities.PHACParticipant.filter({ status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: `${r.child_first_name || ''} ${r.child_last_name || ''}`.trim(), phone: r.parent_guardian_phone, email: r.parent_guardian_email }),
  },
  {
    area: 'reception', label: 'Other Programs', color: '#64748b',
    load: () => base44.entities.ProgramRegistration.filter({ status: 'waitlisted' }, { limit: 500 }),
    map: (r) => ({ name: r.participant_name, phone: r.participant_phone, email: r.participant_email }),
  },
];

export function useCrossWaitlistIndex() {
  return useQuery({
    queryKey: ['cross-waitlist-index'],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const results = await Promise.all(AREA_DEFS.map(async (def) => {
        try {
          const page = await def.load();
          return (page.items || []).map((r) => {
            const mapped = def.map(r);
            return { area: def.area, label: def.label, color: def.color, ...mapped };
          });
        } catch {
          return [];
        }
      }));
      return results.flat();
    },
  });
}

export const normalizeName = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const normalizePhone = (s) => (s || '').replace(/\D/g, '');
export const normalizeEmail = (s) => (s || '').trim().toLowerCase();

// person: { first_name, last_name, full_name?, phone, email } — matched against
// the index by email, then phone, then full name. excludeArea hides the person's
// own program area (pass null to match everything, e.g. on a client profile).
export function findOtherWaitlists(person, index, excludeArea) {
  if (!person) return [];
  const fullName = normalizeName(person.full_name || `${person.first_name || ''} ${person.last_name || ''}`);
  const phone = normalizePhone(person.phone);
  const email = normalizeEmail(person.email);
  const seen = new Set();
  const out = [];
  (index || []).forEach((e) => {
    if (e.area === excludeArea || seen.has(e.area)) return;
    let match = false;
    if (email && e.email && normalizeEmail(e.email) === email) match = true;
    if (!match && phone.length >= 7 && e.phone) {
      const ep = normalizePhone(e.phone);
      if (ep.length >= 7 && ep === phone) match = true;
    }
    if (!match && fullName.length >= 4 && normalizeName(e.name) === fullName) match = true;
    if (match) {
      seen.add(e.area);
      out.push({ area: e.area, label: e.label, color: e.color });
    }
  });
  return out;
}