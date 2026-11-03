import { base44 } from "@/api/base44Client";

// Entity list() can hand back either a plain array or a page ({ items, has_more }).
// Unwrap both so every caller gets an array it can map/filter safely.
const asList = (res) => (Array.isArray(res) ? res : res?.items || []);

export const listEllLearners = async () =>
  asList(await base44.entities.ELLLearner.list({ limit: 2000 }));

export const listEllClasses = async () =>
  asList(await base44.entities.ELLClass.list({ limit: 1000 }));

export const listEllInstructors = async () =>
  asList(await base44.entities.ELLInstructor.list({ limit: 1000 }));