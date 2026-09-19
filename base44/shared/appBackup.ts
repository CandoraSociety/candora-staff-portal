// Shared mapping + helpers for the weekly app-data backup to SharePoint.
// Each backup group targets one portal's SharePoint folder (named the same as
// its PortalCard, matching syncPortalFolders) and lists the app entities that
// belong to that portal. Everything entered in the app is covered by exactly
// one group, so a full weekly run backs up all app data.

export { DRIVE_ID, getGraphToken } from "./crtWorkbook.ts";

import { DRIVE_ID } from "./crtWorkbook.ts";

// Restricted subfolder created inside each portal folder — _PRIVATE_ prefix
// marks restricted-access folders per Candora convention.
export const BACKUP_ROOT_NAME = "_PRIVATE_ Data Backups";

export const BACKUP_GROUPS = [
  {
    key: "pathways",
    fallbackFolder: "Pathways",
    entities: ["Client", "TransitionClient", "ClientTransfer", "StatusChange", "PathwaysStaff", "CompassTask", "CompassBillingVerification", "InternalTraining", "WorkExposurePlacement", "WorkExposureHoursSubmission", "Employer", "FinancialRecord", "PurchaseRequest", "WeeklySchedule", "Workshop", "WorkshopSignup", "NarrativeSummary", "StaffMonthlyReport", "TrainingPlan", "TrainingPlanItem", "TrainingRole", "LearnerProgress", "LearnerEnrollment", "Invoice", "InvoicePackage", "InvoiceConfig", "CrtWorkbook"],
  },
  {
    key: "rc",
    fallbackFolder: "Resource Centre",
    entities: ["RCClient", "RCClientVisit", "RCClientNote", "RCClientNeed", "RCServiceLog", "RCReferral", "RCAppointment", "RCCaseworker", "IntensiveCase", "StaffProgramRole", "DirectoryResource"],
  },
  {
    key: "finance",
    fallbackFolder: "Finance",
    entities: ["StaffReimbursementRequest", "CCReceiptSubmission", "ReimbursementEntry", "CCReceiptEntry", "CCStatement", "CCStatementLineItem", "ESignatureProfile", "SavedESignature", "ESignatureLog"],
  },
  {
    key: "nexushr",
    fallbackFolder: "NexusHR",
    entities: ["Employee", "EmployeeDocument", "EmployeeTimeLog", "ShiftTemplate", "ShiftAssignment", "EventShift", "Timesheet", "TimeOffRecord", "OnboardingDocument", "OnboardingTemplate", "OnboardingRecord", "NDASignature", "Department", "Training", "TrainingRecord", "PerformanceReview", "IncidentReport", "IncidentResolution", "CorrectiveAction", "CareerPlan", "NexusDocument", "RecognitionType", "EmployeeRecognition", "ServiceAward", "LegalCase", "StaffVolunteerRequest", "Contract"],
  },
  {
    key: "reception",
    fallbackFolder: "Reception",
    entities: ["ReceptionAppointment", "DropInVisit", "UrgentAlert"],
  },
  {
    key: "central-registration",
    fallbackFolder: "Central Registration",
    entities: ["SelfRegRequest", "SelfRegProgram", "ProgramRegistration", "CentralRegAreaCapacity"],
  },
  {
    key: "frn",
    fallbackFolder: "FRN",
    entities: ["FRNParticipant", "FRNReferral", "FRNAssessment", "FRNSession"],
  },
  {
    key: "phac",
    fallbackFolder: "PHAC",
    entities: ["PHACProgram", "PHACSession", "PHACParticipant"],
  },
  {
    key: "ell",
    fallbackFolder: "English Language Learning",
    entities: ["ELLClass", "ELLInstructor", "ELLAssessment", "ELLLearner"],
  },
  {
    key: "empoweru",
    fallbackFolder: "EmpowerU",
    entities: ["EmpowerUCohort", "EmpowerUParticipant", "EmpowerURegistration", "EmpowerUAccountSetup", "EmpowerUServiceLog"],
  },
  {
    key: "digilit",
    fallbackFolder: "Digital Literacy",
    entities: ["DigiLitSession", "DigiLitParticipant", "DigiLitEvaluation"],
  },
  {
    key: "community",
    fallbackFolder: "Community Programs",
    entities: ["CommunityProgram", "CommunitySession", "CommunityParticipant", "CommunityRegistration", "CommunityEvaluation"],
  },
  {
    key: "childminding",
    fallbackFolder: "Childminding",
    entities: ["ChildmindingRecord", "ChildmindingSession"],
  },
  {
    key: "volunteermgr",
    fallbackFolder: "Volunteer Manager",
    entities: ["Volunteer", "VolunteerApproval", "VolunteerEvent", "VolunteerPosition", "VolunteerEventSignup", "VolunteerCohortRequest", "VolunteerProfileChange", "VolunteerRecognition", "VolunteerAvailability", "VolunteerTimeLog", "VolunteerProgram", "VolunteerDocument", "VolunteerTrainingPathway"],
  },
  {
    key: "lms",
    fallbackFolder: "LMS",
    entities: ["TrainingModule", "TrainingProgram", "TrainingResource", "Certificate"],
  },
  {
    key: "marketing",
    fallbackFolder: "Marketing",
    entities: ["MarketingAsset", "EmailCampaign", "EmailTemplate", "EmailList", "MarketingCampaign", "MarketingRequest", "MarketingResource", "SocialPost", "Donation", "ContentPiece", "Donor", "DonationPage", "MediaCoverage", "PressRelease", "MediaContact", "PublicEventSubmission", "TicketType", "TicketOrder"],
  },
  {
    key: "board",
    fallbackFolder: "Board",
    entities: ["BoardMember", "BoardDocument", "Meeting", "MinuteEntry", "AgendaItem", "StrategicGoal"],
  },
  {
    key: "ed",
    fallbackFolder: "Executive Director",
    entities: ["EDOrgPosition", "EDOrgScenario", "EDOrgTeam", "EDOrgSheetNote", "EDBudget", "EDTask", "EDProject", "EDObjective", "EDKPI", "EDNote", "EDBoardReport", "EDMeeting", "EDAgendaItem"],
  },
  {
    key: "grants",
    fallbackFolder: "Grants",
    entities: ["Project", "ProjectGroup", "ProjectDocument", "ProjectObjective", "ProjectTask", "ProjectMilestone", "ProjectNote", "FundingSource", "FundingStream", "PotentialFunder", "ProposalSection", "ProposalTemplate", "SubmissionDocument", "FunderReport", "FunderReportingFile", "FunderReportingDoc", "FunderReportingHub", "FunderReportingDeadline", "OrganizationInfo", "Report"],
  },
  {
    key: "reporting",
    fallbackFolder: "Reporting",
    entities: ["AGRReport", "AGRReportSection", "AGRInfoToGather", "AGRBranding", "AGRCoverFavourite", "GeneratedReport", "AGRReportData", "AGRAnalysisResult"],
  },
  {
    key: "food",
    fallbackFolder: "Food Services",
    entities: ["Recipe", "FoodCustomer", "MenuItem", "InventoryItem", "FoodOrder", "CateringMenuItem", "ServiceOption", "SpaceConfig", "RentalEquipment", "BookingRequest", "CateringQuote", "FoodServiceSchedule"],
  },
  {
    key: "eventsmgr",
    fallbackFolder: "Events Manager",
    entities: ["Event", "Program", "Contact", "LearningResource"],
  },
  {
    key: "filemanager",
    fallbackFolder: "File Manager",
    entities: ["File", "FileCategory", "FileAccessApprovalRequest", "AccessPermission", "Note", "Collection", "WorkspaceItem", "EditorAsset"],
  },
  {
    key: "winter-wonderland",
    fallbackFolder: "Winter Wonderland",
    entities: ["WinterFestival", "FestivalComponent", "FestivalEvent"],
  },
  {
    key: "archives",
    fallbackFolder: "Archives",
    entities: ["ArchiveBio", "ArchiveStory", "ArchiveTimelineItem"],
  },
  {
    key: "general",
    fallbackFolder: "Administration",
    entities: ["Announcement", "PortalCard", "DashboardWidget", "UserDashboardPreference", "UserWidgetPreference", "DashboardNotification", "OrgSettings", "MemoryNote", "AppChangeRequest", "PersonalOrganizer", "Reminder", "Presentation", "HowToSearchLog", "HowToAnswer", "DevelopmentTask"],
  },
];

export function findGroup(key) {
  return BACKUP_GROUPS.find((g) => g.key === key);
}

// Same character restrictions syncPortalFolders applies to portal folder names.
export function sanitizeFolderName(name) {
  return String(name || "").replace(/["#%*:<>?/\\{|}]/g, "").trim();
}

// Convert entity records to a CSV string. Nested objects/arrays are stored as
// JSON text so no data is lost; the file opens directly in Excel.
export function toCsv(records) {
  if (!records || !records.length) return null;
  const keySet = new Set();
  for (const record of records) {
    for (const k of Object.keys(record)) keySet.add(k);
  }
  const preferred = ["id", "created_date", "updated_date", "created_by_id"];
  const cols = [
    ...preferred.filter((k) => keySet.has(k)),
    ...[...keySet].filter((k) => !preferred.includes(k)).sort(),
  ];
  const esc = (value) => {
    if (value === null || value === undefined) return "";
    let s = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [cols.join(",")];
  for (const record of records) {
    lines.push(cols.map((c) => esc(record[c])).join(","));
  }
  return lines.join("\n");
}

// Get-or-create a nested folder path in the backup drive. Returns nothing —
// callers upload by path afterwards. Each missing segment is created in turn.
export async function ensureFolderPath(accessToken, segments) {
  let parentId = "root";
  let path = "";
  for (const segment of segments) {
    if (!segment) throw new Error("Empty folder segment in path: " + segments.join("/"));
    path += "/" + segment;
    const getRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${path}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (getRes.ok) {
      parentId = (await getRes.json()).id;
      continue;
    }
    const createRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${parentId}/children`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: segment,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail",
        }),
      }
    );
    if (createRes.ok) {
      parentId = (await createRes.json()).id;
    } else if (createRes.status === 409) {
      const retryRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${path}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!retryRes.ok) {
        throw new Error(`Failed to create backup folder "${path}": ${await createRes.text()}`);
      }
      parentId = (await retryRes.json()).id;
    } else {
      throw new Error(`Failed to create backup folder "${path}": ${await createRes.text()}`);
    }
  }
  return path;
}

// ===== Uploaded-file backup (receipts, signature images, generated PDFs) =====

// Only these file extensions are treated as uploaded files to copy.
const FILE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'pdf',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'md', 'ics',
]);

// Copy at most this many files per portal group per run, so a huge backlog
// can't make a single run take forever.
export const MAX_FILES_PER_GROUP = 500;

// Scan entity records for uploaded-file URLs: any field whose name contains
// "url" and whose value points at a file with a known extension. SharePoint
// web URLs are skipped — those files already live in SharePoint.
export function collectFileUrls(entityName, records) {
  const found = [];
  const seenUrls = new Set();
  for (const record of records || []) {
    for (const [field, value] of Object.entries(record)) {
      if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) continue;
      if (!field.toLowerCase().includes('url')) continue;
      if (/sharepoint\.com/i.test(value)) continue;
      const clean = value.split('?')[0];
      const ext = (clean.split('.').pop() || '').toLowerCase();
      if (!FILE_EXTENSIONS.has(ext)) continue;
      if (seenUrls.has(value)) continue;
      seenUrls.add(value);
      found.push({ url: value, ext, name: `${entityName}_${clean.split('/').pop()}` });
    }
  }
  return found;
}

// Download an uploaded file from app storage and copy it into the backup folder.
export async function backupFile(accessToken, filesPath, file) {
  const downloadRes = await fetch(file.url);
  if (!downloadRes.ok) {
    throw new Error(`download failed (${downloadRes.status})`);
  }
  const bytes = new Uint8Array(await downloadRes.arrayBuffer());
  const contentType = downloadRes.headers.get('content-type') || 'application/octet-stream';
  const uploadRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${filesPath}/${file.name}:/content`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': contentType },
      body: bytes,
    }
  );
  if (!uploadRes.ok) {
    throw new Error(`upload failed: ${(await uploadRes.text()).slice(0, 200)}`);
  }
}