// Shared display-name normalization for backend functions.
//
// Some platform accounts have their built-in full_name created from the email
// prefix (e.g. "graham.currie"), and that field is read-only. Stored records
// must show a real name instead — every backend write of a person's name goes
// through properUserName().

function prettify(s: string): string {
  return s
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Returns the user's proper display name: their full_name when it is a real
// name, otherwise the email-derived name prettified ("graham.currie" →
// "Graham Currie"). Never returns the raw email or the email-prefix name.
export function properUserName(user: any): string {
  const raw = (user?.full_name || "").trim();
  if (raw && !raw.includes("@") && !/^[a-z0-9]+([._-][a-z0-9]+)+$/.test(raw)) {
    return raw;
  }
  const email = (user?.email || "").trim();
  if (email.includes("@")) {
    return prettify(email.split("@")[0]) || "Staff";
  }
  if (raw) return prettify(raw) || "Staff";
  return "Staff";
}