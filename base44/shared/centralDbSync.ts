// Candora Central Database (RCClient) sync — shared helper.
//
// Each program portal (Pathways, EmpowerU, FRN, PHAC, Community, ELL, DigiLit)
// keeps a CONDENSED profile of its participants in the central RCClient
// database plus a program-participation indicator. This module owns the
// matching/dedup + upsert logic so every program sync behaves identically:
//
//   1. Find an existing central record by person identity (email, then
//      first + last name + date of birth). The same person across multiple
//      programs shares ONE central record with one participation entry per
//      program.
//   2. If found: upsert the participation entry for `program` (by program key)
//      and merge the funder category. Never overwrite the central record's
//      personal details or case-work fields.
//   3. If not found: create a condensed record with name, DOB, phone, email,
//      the participation entry, and (optionally) a funder category.
//
// Personal details are only ever written on first creation — the central
// record (or the first program that created it) owns them thereafter.

export interface PersonalInput {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ParticipationInput {
  program: string;            // e.g. "pathways", "empoweru"
  linkedId: string;           // source program participant record id
  indicator: string;         // computed participation-status text
  funderCategory?: string;   // optional funder tag (pathways | frn | phac_caregiver_capacity | other)
  personal: PersonalInput;
}

function findByIdentity(rc: any, personal: PersonalInput): Promise<any> {
  if (personal.email) {
    return rc.filter({ email: personal.email }).then((list: any[]) =>
      list.find((c: any) => (c.email || '').toLowerCase() === (personal.email || '').toLowerCase())
    );
  }
  return Promise.resolve(null);
}

async function findLinked(rc: any, personal: PersonalInput): Promise<any> {
  let match = await findByIdentity(rc, personal);
  if (!match && personal.first_name && personal.last_name) {
    const byName = await rc.filter({ first_name: personal.first_name, last_name: personal.last_name });
    if (personal.date_of_birth) {
      match = byName.find((c: any) => c.date_of_birth === personal.date_of_birth);
    } else if (byName.length === 1) {
      match = byName[0];
    }
  }
  return match;
}

export async function syncParticipantToCentralDb(base44: any, input: ParticipationInput) {
  const rc = base44.asServiceRole.entities.RCClient;
  const { program, linkedId, indicator, funderCategory, personal } = input;

  const linked = await findLinked(rc, personal);
  const updatedDate = new Date().toISOString();
  const entry = { program, linked_id: linkedId, indicator, updated_date: updatedDate };

  if (linked) {
    const parts = Array.isArray(linked.program_participations) ? [...linked.program_participations] : [];
    const idx = parts.findIndex((p: any) => p.program === program);
    if (idx >= 0) {
      parts[idx] = { ...parts[idx], ...entry };
    } else {
      parts.push(entry);
    }
    const funders = funderCategory
      ? Array.from(new Set([...(linked.funder_categories || []), funderCategory]))
      : (linked.funder_categories || []);
    await rc.update(linked.id, {
      program_participations: parts,
      funder_categories: funders,
    });
    return { status: 'linked', rc_client_id: linked.id };
  }

  await rc.create({
    first_name: personal.first_name || '',
    last_name: personal.last_name || '',
    date_of_birth: personal.date_of_birth || null,
    phone: personal.phone || null,
    email: personal.email || null,
    program_participations: [entry],
    funder_categories: funderCategory ? [funderCategory] : [],
  });
  return { status: 'created' };
}