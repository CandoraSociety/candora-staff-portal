// Portal dashboards that offer a quick upload into their own SharePoint folder.
// The key is the portal's module id (the backend resolves the matching folder).
export const PORTAL_UPLOAD_TARGETS = {
  pathways: "Pathways",
  rc: "Resource Centre",
  ell: "English Language Learning",
  empoweru: "EmpowerU",
  digilit: "Digital Literacy",
  community: "Community Programs",
  childminding: "Childminding",
  "central-registration": "Central Registration",
  phac: "PHAC Programs",
  frn: "FRN Programs",
  nexushr: "HR Management",
  finance: "Finance",
  board: "Board of Directors",
  reception: "Reception",
  food: "Food Services",
  marketing: "Marketing & Fundraising",
  eventsmgr: "Events / Projects / Programs",
  volunteermgr: "Volunteer Manager",
  grants: "Grants",
  ed: "Executive Director Portal",
  reporting: "Reports Portal",
  lms: "Learning Management System",
  archives: "Archives",
  "winter-wonderland": "Winter Wonderland Festival",
  filemanager: "File Manager",
};

export const portalUploadLabel = (moduleId) => PORTAL_UPLOAD_TARGETS[moduleId] || null;