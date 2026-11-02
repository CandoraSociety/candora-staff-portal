// Which training plans belong to which staff member.
// A plan's "For" field is the only thing to match on: an individual plan names
// the person, a group plan names the team. Matching is deliberately loose
// (word overlap) so "Pathways crew" reaches anyone in the Pathways department
// without anyone assigning people by hand.
const norm = (s) => String(s || "").toLowerCase().trim();
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 2);

// Every training module the plan expects: taught blocks plus the modules set
// aside as follow-up work.
export const planModuleKeys = (plan) => {
  const keys = (plan.blocks || [])
    .filter(b => b.type === "session" && b.module_key)
    .map(b => b.module_key);
  (plan.follow_up || []).forEach(f => { if (f.module_key) keys.push(f.module_key); });
  return [...new Set(keys)];
};

export const planAppliesToStaff = (plan, employee, user) => {
  const audience = norm(plan.audience);
  if (!audience) return false;

  const fullName = norm(`${employee?.first_name || ""} ${employee?.last_name || ""}`) || norm(user?.full_name);
  if (fullName && audience.includes(fullName)) return true;

  const lastName = norm(employee?.last_name);
  if (plan.audience_type === "individual") {
    return !!lastName && audience === lastName;
  }

  const own = words([employee?.department, employee?.division, employee?.position].filter(Boolean).join(" "));
  return words(audience).some(w => own.includes(w));
};