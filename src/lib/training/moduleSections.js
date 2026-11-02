// Each training module belongs to the portal it teaches. The staff training
// page lists modules under these portal headings, in this order.
export const TRAINING_MODULE_SECTIONS = [
  { key: "start_here", title: "Start here", moduleKeys: ["welcome"] },
  { key: "main_page", title: "Main Page", moduleKeys: ["dashboard", "dashboard_widgets"] },
  { key: "time_money", title: "Time & Money", moduleKeys: ["staffadmin", "staffadmin_money", "staffadmin_supervisor"] },
  { key: "pathways", title: "Pathways", moduleKeys: ["pathways", "pathways_journey", "pathways_journey_part2", "pathways_assessment", "pathways_service_nav", "pathways_workshops"] },
  { key: "rc", title: "Central Database", moduleKeys: ["central_database_basics", "central_database_advanced"] },
  { key: "ell", title: "ELL", moduleKeys: ["ell"] },
  { key: "centralreg", title: "Central Registration", moduleKeys: ["centralreg"] },
  { key: "reception", title: "Reception", moduleKeys: ["reception"] },
  { key: "filemanager", title: "File Manager", moduleKeys: ["filemanager", "filemanager_advanced"] },
  // Short single-tool trainings — a category of their own, not part of a portal series.
  { key: "mini", title: "Mini-Modules", moduleKeys: ["pathways_resources"] },
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