import { base44 } from "@/api/base44Client";

// Entity list() can hand back either a plain array or a page ({ items, has_more }).
// Unwrap both so every caller gets an array it can map/filter safely.
export const asList = (res) => (Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []);

export const listEllLearners = async () =>
  asList(await base44.entities.ELLLearner.list({ sort: '-created_date', limit: 2000 }));

// Full rosters and filtered waitlists must never write to the same cache entry.
// The child key also avoids reusing an older, waitlist-only cached response.
export const ellLearnersQuery = {
  queryKey: ['ellLearners', 'all'],
  queryFn: listEllLearners,
  select: asList,
};

export const listEllClasses = async () =>
  asList(await base44.entities.ELLClass.list({ limit: 1000 }));

export const listEllInstructors = async () =>
  asList(await base44.entities.ELLInstructor.list({ limit: 1000 }));