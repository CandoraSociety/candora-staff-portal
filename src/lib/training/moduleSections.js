// Each training module belongs to the portal it teaches. The staff training
// page lists modules under these portal headings, in this order.
export const TRAINING_MODULE_SECTIONS = [
  { key: "main_page", title: "Main Page", moduleKeys: ["dashboard", "dashboard_widgets"] },
  { key: "time_money", title: "Time & Money", moduleKeys: ["staffadmin", "staffadmin_money", "staffadmin_supervisor"] },
  { key: "pathways", title: "Pathways", moduleKeys: ["pathways", "pathways_journey", "pathways_journey_part2", "pathways_assessment", "pathways_workshops"] },
  { key: "rc", title: "Resource Centre", moduleKeys: ["rc"] },
  { key: "ell", title: "ELL", moduleKeys: ["ell"] },
  { key: "centralreg", title: "Central Registration", moduleKeys: ["centralreg"] },
];

// Splits the modules a staff member can take into portal sections. Any module
// missing from the map above still appears, under "Other training".
export function groupModulesBySection(modules) {
  const byKey = new Map(modules.map(m => [m.key, m]));
  const sections = TRAINING_MODULE_SECTIONS
    .map(s => ({ ...s, modules: s.moduleKeys.map(k => byKey.get(k)).filter(Boolean) }))
    .filter(s => s.modules.length);

  const placed = new Set(sections.flatMap(s => s.modules.map(m => m.key)));
  const rest = modules.filter(m => !placed.has(m.key));
  if (rest.length) sections.push({ key: "other", title: "Other training", modules: rest });
  return sections;
}