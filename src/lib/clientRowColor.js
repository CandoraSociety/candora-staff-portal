export function clientRowColor(client) {
  const ps = client.program_status;
  const cr = client.closed_reason;

  const badEndings = ["cancelled", "incomplete", "withdrew", "relocated", "no_longer_eligible", "no_contact", "duplicate"];

  if (ps === "incomplete" || ps === "cancelled") return "bg-red-100 hover:bg-red-200";
  if (client.file_closed && badEndings.includes(cr)) return "bg-red-100 hover:bg-red-200";
  if (ps === "complete" && client.followup_90day_status) return "bg-green-100 hover:bg-green-200";
  if (ps === "complete") return "bg-blue-100 hover:bg-blue-200";
  if (ps === "in_progress") return "bg-yellow-100 hover:bg-yellow-200";
  return "";
}