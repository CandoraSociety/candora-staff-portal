// ── Test Mode sandbox ──────────────────────────────────────────────────────
// When Test Mode is on, the pre-initialized base44 client's data layers
// (entities, functions, integrations, users, analytics) are swapped for
// in-memory simulations. Nothing is ever sent to the backend: reads return
// auto-generated demo records, writes mutate only the in-memory store, and
// live-service calls (email, AI, SharePoint/Excel writes...) report simulated
// success. Test data lives only in this browser tab's memory — it is never
// stored and disappears when Test Mode is turned off (the toggle reloads
// the app so no live data stays cached).

import { PRIORITY_DEMO } from './demoDataPriority';
import { readSession } from '../training/trainingSession';
import { readFacilitatorSession } from '../training/facilitatorSession';

const SESSION_KEY = 'candora-test-mode';

// A learner or facilitated training session keeps the app safely on simulated
// data. While one is active, Test Mode cannot be switched off — someone mid-tour
// must not be able to flip the toggle and land in the live portal unnoticed.
// (Exits clear the session keys directly, so ending training is unaffected.)
export const isTrainingSessionActive = () => !!(readSession() || readFacilitatorSession());

export const isTestMode = () => {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

// Toggling reloads the app so no live data remains in memory or query caches.
export const setTestMode = (on) => {
  if (!on && isTrainingSessionActive()) return; // blocked while training runs
  try { sessionStorage.setItem(SESSION_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  window.location.reload();
};

let realClient = null;
let realEntitiesRef = null;
let realIntegrationsRef = null;

// Public-storage upload that bypasses the Test Mode simulation. Used for
// e-signature images: the learner's signature setup is one of the few things
// that is REAL during training and persists after the session ends, so the
// uploaded image must be a real, permanent URL — not the simulated pixel.
export async function realUploadPublicFile(file) {
  return realIntegrationsRef.Core.UploadPublicFile({ file });
}

// ── In-memory database ─────────────────────────────────────────────────────
const db = new Map();
let idCounter = 0;
const now = () => new Date().toISOString();
const mkId = (entity) => `test_${entity.toLowerCase().replace(/[^a-z0-9]/g, '')}_${++idCounter}`;
const D = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

// Every module is allowed in Test Mode so any staff member can open any portal
// and exercise it on demo data.
const MODULE_IDS = [
  'pathways', 'grants', 'finance', 'rc', 'ell', 'empoweru', 'phac', 'frn',
  'digilit', 'community', 'centralreg', 'childminding', 'rworker', 'reception_simple', 'winterwonderland',
  'lms', 'reception', 'board', 'nexushr', 'volunteermgr', 'marketing',
  'eventsmgr', 'reporting', 'food', 'filemanager', 'outlook', 'archives',
  'presentations',
];

// Live portal cards are keyed by these module ids — include them so the Portal
// tab shows the same set of cards in Test Mode instead of an empty grid.
const DEMO_MODULE_IDS = [...new Set([...MODULE_IDS, 'central-registration', 'winter-wonderland', 'joblab', 'ed'])];

// Minimal demo data — a couple of fake records per portal so screens aren't
// blank. Anything not listed here starts empty and is created in-memory as
// you use Test Mode.
function demoData() {
  const base = {
    Announcement: [
      { title: 'Welcome to Test Mode', content: 'You are viewing simulated data. Nothing here is real, and nothing you change is saved to the live portal.', category: 'general', priority: 'high', is_active: true, publish_date: D(0) },
      { title: 'Staff lunch on Friday', content: 'Demo announcement for Test Mode.', category: 'event', priority: 'low', is_active: true, publish_date: D(2) },
    ],
    OrgSettings: [
      { org_name: 'Candora (Test Mode)', welcome_message: 'Welcome to Test Mode — simulated data only', primary_color: '#f5c116', secondary_color: '#0f1f6b', logos: [],
        // Every tier can reach every portal while testing, so the Portal tab and
        // sidebar show the full set of tools.
        tier_portal_access: Object.fromEntries(
          ['executive_director', 'manager', 'team_lead', 'frontline_staff', 'board', 'extended'].map((t) => [t, DEMO_MODULE_IDS])
        ) },
    ],
    // Permissions are what the Portal tab, sidebar and portal guards read — so
    // Test Mode grants every module to the tester individually as well as by tier.
    AccessPermission: DEMO_MODULE_IDS.map((m) => ({
      target_type: 'module',
      target_id: m,
      scope_type: 'individual',
      scope_value: DEMO_EMAIL,
      permission: 'allow',
      is_active: true,
    })),
    MemoryNote: [
      { title: 'Test Mode active', content: 'Everything you see is simulated demo data.', category: 'reminder', priority: 'low', is_completed: false },
    ],
    User: [
      { id: 'test_user_1', email: 'test.user@candora.ca', full_name: 'Test User', role: 'user', created_date: now() },
      { id: 'test_user_2', email: 'test.admin@candora.ca', full_name: 'Test Admin', role: 'admin', created_date: now() },
    ],
    Employee: [
      { first_name: 'Terry', last_name: 'Tester', email: 'test.user@candora.ca', position: 'Frontline Staff', department: 'Programs', org_tier: 'frontline_staff', is_active: true, hire_date: D(400) },
      { first_name: 'Dana', last_name: 'Demo', email: 'test.admin@candora.ca', position: 'Program Manager', department: 'Administration', org_tier: 'manager', is_active: true, hire_date: D(800) },
      { first_name: 'Sam', last_name: 'Staff', email: 'sam.staff@candora.ca', position: 'Program Staff', department: 'Programs', org_tier: 'frontline_staff', is_active: true, hire_date: D(200), manager_email: 'test.user@candora.ca' },
    ],
    Client: [
      { id: 'demo-pw-casey', first_name: 'Casey', last_name: 'Sample', compass_hsid: '10001', service_type: 'pathways', program_status: 'in_progress', status: 'new', service_start_date: D(30), counsellor_name: 'Terry Tester', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', phone: '780-555-0101', email: 'casey.sample@example.ca', exposure_course: true, external_employer: true, employment_supports: true, barriers_addressed: true, bit_completed: true, bit_checkin_frequency: 'Bi-Weekly', bit_review_dates: [D(21), D(7)], barrier_1: 'Transportation', barrier_1_status: 'unresolved', barrier_1_challenges: 'No access to a vehicle\nUnreliable public transit', barrier_1_action_steps: 'Provide transit passes', barrier_1_notes: 'Bus pass provided for the work exposure placement.', barrier_2: 'Financial Barriers', barrier_2_status: 'unresolved', barrier_2_challenges: 'Inability to afford work-related expenses', barrier_2_action_steps: 'Financial literacy workshops', barrier_2_notes: 'Purchase request submitted for safety boots and work clothes.', internal_referrals: ['digital_literacy'], external_referrals: [], action_plan_submitted: true, sdp_items: ['exposure_course', 'employment_supports', 'job_applications'], sdp_item_details: { job_applications: { timeline_start: D(25), timeline_end: D(-7) }, employment_supports: { timeline_start: D(28), timeline_end: D(-14) }, exposure_course: { timeline_start: D(24), timeline_end: D(-10) } }, barrier_1_timeline_start: D(28), barrier_1_timeline_end: D(5), barrier_2_timeline_start: D(28), barrier_2_timeline_end: D(2) },
      { id: 'demo-pw-jordan', first_name: 'Jordan', last_name: 'Example', compass_hsid: '10002', service_type: 'direct_to_employment', program_status: 'complete', status: 'new', service_start_date: D(120), eda_completion_date: D(20), counsellor_name: 'Terry Tester', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', phone: '780-555-0102', email: 'jordan.example@example.ca', employer_name: 'Sample Solutions Ltd.', job_title: 'Warehouse Associate', job_start_date: D(35), job_wage: 18.5, employed_ftpt: 'FT', intake_date: D(125), action_plan_submitted: true, completion_date: D(20), followup_90day_date: D(-55), dea_activities: [
          { id: 'dea-jordan-1', type: 'Job Search Workshop', anticipated_end_date: D(118), completed_date: D(118) },
          { id: 'dea-jordan-2', type: 'Interview Skills Workshop', anticipated_end_date: D(115), completed_date: D(115) },
          { id: 'dea-jordan-3', type: 'One on One Career Counselling', anticipated_end_date: D(110), completed_date: D(111), notes: 'Targeting warehouse and logistics postings.' }
        ] },
      { id: 'demo-pw-sam', first_name: 'Sam', last_name: 'Specimen', compass_hsid: '10003', service_type: 'pathways', program_status: 'in_progress', status: 'new', service_start_date: D(45), counsellor_name: 'Terry Tester', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', phone: '780-555-0103', email: 'sam.specimen@example.ca', internal_placement: 'cleaning_arc', internal_placement_details: 'Cleaning crew at the ARC — building workplace routines and references', placement_start_date: D(15), placement_supervisor: 'Dana Demo', placement_schedule: 'Mon/Wed/Fri mornings' },
      // Service Navigation demo client — the tester is the assigned navigator,
      // while a different counsellor owns the file (the usual arrangement).
      { id: 'demo-pw-priya', first_name: 'Priya', last_name: 'Barrier', compass_hsid: '10007', service_type: 'pathways', program_status: 'in_progress', status: 'new', service_start_date: D(45), intake_date: D(60), counsellor_name: 'Dana Demo', assigned_worker: 'test.admin@candora.ca', assigned_worker_name: 'Dana Demo', assigned_service_navigator: 'test.user@candora.ca', assigned_service_navigator_name: 'Terry Tester', service_navigation_supports: true, barriers_addressed: true, bit_completed: true, bit_checkin_frequency: 'Bi-Weekly', bit_review_dates: [D(20), D(6)], barrier_1: 'Transportation', barrier_1_status: 'in_progress', barrier_1_challenges: 'No access to a vehicle\nUnreliable public transit', barrier_1_action_steps: 'Provide transit passes', barrier_1_timeline_start: D(30), barrier_1_timeline_end: D(-14), barrier_2: 'Childcare', barrier_2_status: 'unresolved', barrier_2_challenges: 'No affordable care for two children under 5', barrier_2_action_steps: 'Explore subsidized daycare options', barrier_2_timeline_start: D(28), barrier_2_timeline_end: D(-10), action_plan_submitted: true, sdp_items: ['job_applications'], sdp_item_details: { job_applications: { timeline_start: D(25), timeline_end: D(-7) } }, internal_referrals: ['digital_literacy'], external_referrals: [], phone: '780-555-0107', email: 'priya.barrier@example.ca' },
      // Intake section demo clients — unassigned, so they land in the New Intake lists
      { id: 'demo-pw-intake-jamie', first_name: 'Jamie', last_name: 'Joblab', status: 'new', self_registered: true, intake_date: D(2), phone: '780-555-0110', email: 'jamie.joblab@example.ca' },
      { id: 'demo-pw-intake-rai', first_name: 'Rai', last_name: 'Referral', compass_hsid: '10004', status: 'new', referral_from_cec: true, intake_date: D(4), phone: '780-555-0111', email: 'rai.referral@example.ca' },
      { id: 'demo-pw-intake-alex', first_name: 'Alex', last_name: 'Assessed', compass_hsid: '10005', status: 'pending', intake_date: D(7), phone: '780-555-0112', email: 'alex.assessed@example.ca' },
    ],
    CompassTask: [
      { client_id: 'demo-pw-casey', client_name: 'Casey Sample', compass_hsid: '10001', title: 'Verify ERA complete', instructions: "Casey's Employment Readiness Assessment (ERA) is done outside the portal — once it's done, mark this task verified so the file shows the step was passed.", status: 'pending', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester' },
      { client_id: 'demo-pw-casey', client_name: 'Casey Sample', compass_hsid: '10001', title: 'Enter Casey into Compass', instructions: "Create the Compass entry for Casey Sample and confirm the HSID matches the file.", status: 'pending', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester' },
      { client_id: 'demo-pw-casey', client_name: 'Casey Sample', compass_hsid: '10001', title: 'Verify employment supports entry', instructions: "Confirm Casey's employment supports are recorded in Compass.", status: 'pending', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester' },
    ],
    PurchaseRequest: [
      { client_id: 'demo-pw-casey', client_name: 'Casey Sample', request_type: 'employment_supports', support_type: 'Work Clothes', description: "Safety boots and work clothes for Casey's work exposure placement", estimated_amount: 180, requested_date: D(5), requested_by: 'test.user@candora.ca', requested_by_name: 'Terry Tester', assigned_worker: 'test.user@candora.ca', status: 'pending' },
    ],
    WorkExposurePlacement: [
      { client_id: 'demo-pw-casey', client_name: 'Casey Sample', business_name: 'Riverside Logistics', location: 'Edmonton', position_type: 'Warehouse', expected_hours_per_week: 20, hourly_rate: 15, start_date: D(10), anticipated_completion_date: D(-21), status: 'in_progress', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester' },
    ],
    RCClient: [
      { id: 'demo-rc-riley', first_name: 'Riley', last_name: 'Rehearsal', phone: '780-555-0201', email: 'riley@example.ca', status: 'active', case_status: 'active', service_category: 'general', assigned_worker: 'Terry Tester', assigned_worker_name: 'Terry Tester', notes: 'Demo client for Test Mode' },
      { first_name: 'Morgan', last_name: 'Mock', phone: '780-555-0202', email: 'morgan@example.ca', status: 'active', notes: 'Demo client for Test Mode' },
    ],
    RCServiceLog: [
      { client_name: 'Riley Rehearsal', service_type: 'Information & Referral', service_date: D(3), notes: 'Demo service log entry (Test Mode)' },
    ],
    Project: [
      { name: 'Test Mode Demo Project', description: 'A sample project for Test Mode.', status: 'active', start_date: D(60), end_date: D(-90) },
      { name: 'Sample Community Initiative', description: 'Another sample project.', status: 'planning', start_date: D(10) },
    ],
    FundingSource: [
      { name: 'Demo Funder Foundation', type: 'foundation', status: 'active' },
      { name: 'Sample Government Grant', type: 'government', status: 'active' },
    ],
    PotentialFunder: [
      { name: 'Example Trust Fund', interest_level: 'high', notes: 'Demo potential funder' },
    ],
    GrantKnowledgeEntry: [
      { title: 'Demo knowledge note', content: 'This entry only exists in Test Mode. Ask the knowledge base a question to see simulated retrieval.', entry_type: 'note', tags: ['demo', 'test'] },
      { title: 'Sample funder conversation', content: 'Simulated AI conversation transcript retained from Test Mode.', entry_type: 'conversation', related_funder: 'Demo Funder Foundation' },
    ],
    EmpowerUCohort: [
      { name: 'EmpowerU Test Cohort', start_date: D(30), end_date: D(-40), delivery_mode: 'virtual', room: 'virtual', capacity: 15, registration_open: true, status: 'in_progress', facilitator_name: 'Dana Demo' },
    ],
    EmpowerUParticipant: [
      { first_name: 'Priya', last_name: 'Practice', phone: '780-555-0301', email: 'priya@example.ca', notes: 'Demo participant (Test Mode)' },
      { first_name: 'Alex', last_name: 'Artifact', phone: '780-555-0302', email: 'alex@example.ca', notes: 'Demo participant (Test Mode)' },
    ],
    EmpowerURegistration: [
      { participant_name: 'Priya Practice', cohort_name: 'EmpowerU Test Cohort', registration_date: D(25), status: 'enrolled', waitlist_status: 'waiting' },
      { participant_name: 'Alex Artifact', cohort_name: 'EmpowerU Test Cohort', registration_date: D(24), status: 'waitlisted', waitlist_position: 1, waitlist_status: 'contacted' },
    ],
    EmpowerUApplication: [
      { cohort_name: 'EmpowerU Test Cohort', status: 'pending', application_date: D(1), first_name: 'New', last_name: 'Applicant', phone: '780-555-0310', email: 'new.applicant@example.ca', consent_agreed: true },
    ],
    EmpowerUAccountSetup: [
      { participant_name: 'Priya Practice', cohort_name: 'EmpowerU Test Cohort', status: 'appointment_scheduled', savings_amount: 300, follow_up_attempts: 1, next_action_date: D(-2) },
    ],
    EmpowerUServiceLog: [
      { participant_name: 'Priya Practice', cohort_name: 'EmpowerU Test Cohort', service_date: D(12), service_type: 'follow_up', summary: 'Demo follow-up call (Test Mode)', follow_up_needed: true },
    ],
    EmpowerUDocument: [
      { title: 'Demo ID copy', doc_type: 'ID copy', category: 'participant', participant_name: 'Priya Practice', cohort_name: 'EmpowerU Test Cohort', file_name: 'demo-id-copy.pdf', notes: 'Demo document (Test Mode)' },
    ],
    ChildmindingSession: [
      { title: 'Demo Morning Childminding', date: D(0), start_time: '09:00', end_time: '11:30', location: 'Playroom', capacity: 8, status: 'scheduled', notes: 'Demo session (Test Mode)' },
      { title: 'Demo Afternoon Childminding', date: D(3), start_time: '13:00', end_time: '15:00', location: 'Playroom', capacity: 10, status: 'completed' },
    ],
    ChildmindingRecord: [
      { child_first_name: 'Sammy', parent_first_name: 'Riley', parent_last_name: 'Rehearsal', parent_name: 'Riley Rehearsal', date: D(0), check_in_time: '09:05', check_out_time: '11:20', hours: 2.5, program: 'pathways', billing_amount: 50, billing_status: 'unbilled', notes: 'Demo childminding record (Test Mode)' },
      { child_first_name: 'Noa', parent_first_name: 'Lena', parent_last_name: 'Learner', parent_name: 'Lena Learner', date: D(3), check_in_time: '13:00', check_out_time: '14:40', hours: 1.75, program: 'ell', billing_amount: 0, billing_status: 'n/a', notes: 'Demo childminding record (Test Mode)' },
    ],
    ELLLearner: [
      { first_name: 'Lena', last_name: 'Learner', phone: '780-555-0401', email: 'lena@example.ca', clb_level: 'clb_4', enrollment_status: 'active', intake_date: D(45), waitlist_status: 'waiting' },
      { first_name: 'Omar', last_name: 'Observer', phone: '780-555-0402', email: 'omar@example.ca', clb_level: 'not_assessed', enrollment_status: 'waitlisted', waitlist_date: D(10), waitlist_status: 'waiting' },
    ],
    ELLClass: [
      { name: 'Test Mode Morning Class', level: 'CLB 4-5', status: 'active', start_date: D(40) },
    ],
    ELLInstructor: [
      { name: 'Iris Instructor', email: 'iris@example.ca', phone: '780-555-0403' },
    ],
    CommunityProgram: [
      { name: 'Sample Community Program', description: 'Demo program for Test Mode.', status: 'active', start_date: D(30) },
    ],
    CommunityParticipant: [
      { first_name: 'Chris', last_name: 'Community', phone: '780-555-0501', email: 'chris@example.ca', notes: 'Demo participant (Test Mode)' },
      { first_name: 'Jamie', last_name: 'Joiner', phone: '780-555-0502', email: 'jamie@example.ca', notes: 'Demo participant (Test Mode)' },
    ],
    CommunitySession: [
      { name: 'Sample Session', date: D(5), location: 'Main Hall', status: 'completed' },
    ],
    FRNParticipant: [
      { first_name: 'Fay', last_name: 'Fake', phone: '780-555-0601', email: 'fay@example.ca', preferred_language: 'English' },
      { first_name: 'Nico', last_name: 'Notional', phone: '780-555-0602', email: 'nico@example.ca', preferred_language: 'Arabic' },
    ],
    FRNProgram: [
      { name: 'Connect Parent Group (Demo)', category: 'parenting', status: 'active', coordinator_name: 'Demo Coordinator', capacity: 10, schedule_description: 'Tuesdays 1:00–3:00 pm' },
      { name: 'Wellness Compass (Demo)', category: 'wellness', status: 'active', coordinator_name: 'Demo Coordinator', capacity: 12, schedule_description: 'Thursdays 10:00 am–12:00 pm' },
    ],
    FRNReferral: [
      { participant_name: 'Fay Fake', program: 'connect_parent_group', program_name: 'Connect Parent Group (Demo)', referral_source: 'internal', referral_date: D(9), status: 'pending', referral_reason: 'Demo referral — parenting support' },
      { participant_name: 'Nico Notional', program: 'wellness_compass', program_name: 'Wellness Compass (Demo)', referral_source: 'external_partner', referral_date: D(4), status: 'assessment_scheduled', referral_reason: 'Demo referral — wellness program' },
    ],
    FRNSession: [
      { name: 'FRN Demo Session', date: D(7), location: 'Small Classroom', status: 'scheduled', program_name: 'Connect Parent Group (Demo)', session_date: D(-3), room: 'small_classroom' },
    ],
    PHACParticipant: [
      { child_first_name: 'Pat', child_last_name: 'Prototype', parent_guardian_name: 'Parent Prototype', parent_guardian_phone: '780-555-0701', parent_guardian_email: 'parent@example.ca', status: 'registered', first_visit_date: D(14) },
      { child_first_name: 'Kit', child_last_name: 'Kindling', parent_guardian_name: 'Guardian Kindling', parent_guardian_phone: '780-555-0702', parent_guardian_email: 'guardian@example.ca', status: 'waitlisted' },
    ],
    PHACProgram: [
      { name: 'Toddler Play Time (Demo)', category: 'play_based', status: 'active', capacity: 12, target_age_min_months: 12, target_age_max_months: 36, schedule_days: ['monday', 'wednesday'], start_time: '09:30', end_time: '11:00', room: 'arc' },
      { name: 'Baby & Me (Demo)', category: 'early_learning', status: 'active', capacity: 10, target_age_min_months: 0, target_age_max_months: 18, schedule_days: ['tuesday'], start_time: '10:00', end_time: '11:30', room: 'large_classroom' },
    ],
    PHACSession: [
      { name: 'PHAC Demo Session', date: D(6), location: 'ARC', status: 'scheduled', program_name: 'Toddler Play Time (Demo)', session_date: D(-2), room: 'arc' },
    ],
    DigiLitParticipant: [
      { first_name: 'Dev', last_name: 'Device', phone: '780-555-0801', email: 'dev@example.ca', registration_date: D(20), status: 'started', skill_level_start: 'beginner', skill_level_current: 'beginner' },
      { first_name: 'Mac', last_name: 'Mockup', phone: '780-555-0802', email: 'mac@example.ca', registration_date: D(12), status: 'waitlisted' },
    ],
    DigiLitSession: [
      { name: 'Digital Literacy Demo Session', date: D(4), location: 'Computer Lab', status: 'scheduled' },
    ],
    Workshop: [
      { name: 'Demo Workshop: Resume Basics', date: D(9), location: 'Employment Classroom', status: 'scheduled', capacity: 12 },
    ],
    WorkshopSignup: [
      { workshop_name: 'Demo Workshop: Resume Basics', client_name: 'Casey Sample', status: 'registered', signup_date: D(15) },
      { workshop_name: 'Demo Workshop: Resume Basics', client_name: 'Jordan Example', status: 'waitlisted', signup_date: D(14) },
    ],
    Timesheet: [
      { employee_name: 'Terry Tester', employee_email: 'test.user@candora.ca', period_start: D(13), period_end: D(7), status: 'submitted', total_hours: 32 },
      { employee_name: 'Dana Demo', employee_email: 'test.admin@candora.ca', period_start: D(13), period_end: D(7), status: 'approved', total_hours: 40 },
      { employee_name: 'Sam Staff', employee_email: 'sam.staff@candora.ca', period_start: D(13), period_end: D(7), status: 'pending', total_hours: 36, supervisor_email: 'test.user@candora.ca' },
    ],
    TimeOffRecord: [
      { employee_name: 'Terry Tester', employee_email: 'test.user@candora.ca', type: 'vacation', start_date: D(-10), end_date: D(-5), status: 'pending' },
      { employee_name: 'Dana Demo', employee_email: 'test.admin@candora.ca', type: 'sick', start_date: D(3), end_date: D(3), status: 'approved' },
      { employee_name: 'Sam Staff', employee_email: 'sam.staff@candora.ca', type: 'vacation', start_date: D(-3), end_date: D(-1), status: 'pending', supervisor_email: 'test.user@candora.ca' },
    ],
    StaffReimbursementRequest: [
      { staff_name: 'Terry Tester', staff_email: 'test.user@candora.ca', amount: 42.5, status: 'submitted', submitted_date: D(5), description: 'Demo supplies (Test Mode)' },
      { staff_name: 'Sam Staff', staff_email: 'sam.staff@candora.ca', amount: 68.2, status: 'submitted', supervisor_status: 'pending', supervisor_email: 'test.user@candora.ca', submitted_date: D(2), description: 'Demo team supplies (Test Mode)' },
    ],
    InvoiceCustomer: [
      { name: 'Demo Customer Org', email: 'billing@democustomer.ca', phone: '780-555-0901', address: '123 Example St, Edmonton, AB' },
    ],
    Invoice: [
      { customer_name: 'Demo Customer Org', invoice_number: 'TEST-0001', issue_date: D(6), due_date: D(-9), amount: 1250, status: 'sent' },
    ],
    FinanceInvoice: [
      { customer_name: 'Demo Customer Org', invoice_number: 'TEST-0001', month: D(6).slice(0, 7), amount: 1250, status: 'sent' },
    ],
    Meeting: [
      { title: 'Demo Board Meeting', meeting_date: `${D(-14)}T18:00:00`, location: 'Board Room', meeting_type: 'Regular Board Meeting', status: 'upcoming', quorum_met: false },
    ],
    BoardMember: [
      { name: 'Bella Boardmember', email: 'bella@example.ca', role: 'Chair', status: 'active' },
      { name: 'Bennet Boardmember', email: 'bennet@example.ca', role: 'Director', status: 'active' },
    ],
    AgendaItem: [
      { meeting_title: 'Demo Board Meeting', title: 'Call to Order', order_index: 1, duration_minutes: 5 },
      { meeting_title: 'Demo Board Meeting', title: 'Executive Director Report', order_index: 2, duration_minutes: 15 },
    ],
    Volunteer: [
      { first_name: 'Vera', last_name: 'Volunteer', email: 'vera@example.ca', phone: '780-555-1001', status: 'active', start_date: D(200) },
      { first_name: 'Vito', last_name: 'Volunteer', email: 'vito@example.ca', phone: '780-555-1002', status: 'active', start_date: D(150) },
    ],
    VolunteerEvent: [
      { name: 'Demo Volunteer Event', date: D(-3), location: 'Main Hall', status: 'scheduled', volunteers_needed: 5 },
    ],
    TrainingModule: [
      { title: 'Demo Training Module', description: 'A sample module for Test Mode.', status: 'published' },
    ],
    TrainingProgram: [
      { name: 'Demo Training Program', description: 'A sample program for Test Mode.', status: 'active' },
    ],
    Note: [
      { title: 'Demo note', content: 'This note only exists in Test Mode.' },
    ],
    // A few vault files so the File Manager training has something to browse
    File: [
      { original_name: 'Grant Application Package.pdf', display_name: 'Grant Application Package', description: 'Demo grant application with attachments (Test Mode)', keywords: ['grant', 'application', 'funder'], file_type: 'pdf', file_size: 482000, category: 'corporate', access_level: 'universal', storage_backend: 'base44', file_url: '', summary: 'Demo file for Test Mode' },
      { original_name: 'ELL Class Roster.xlsx', display_name: 'ELL Class Roster', description: 'Demo class roster (Test Mode)', keywords: ['ell', 'roster', 'class'], file_type: 'xlsx', file_size: 22000, category: 'ell', access_level: 'universal', storage_backend: 'base44', file_url: '', summary: 'Demo file for Test Mode' },
      { original_name: 'Staff Photo.jpg', display_name: 'Staff Photo', description: 'Demo photo (Test Mode)', keywords: ['photo', 'staff'], file_type: 'jpg', file_size: 1240000, category: 'to_be_sorted', access_level: 'universal', storage_backend: 'base44', file_url: '', summary: 'Demo file for Test Mode' },
      { original_name: '1994_Opening_Day_Clipping.pdf', display_name: '1994 Opening Day Clipping', description: 'Simulated newspaper clipping for the Archives training (Test Mode)', keywords: ['archives', 'clipping'], file_type: 'pdf', file_size: 840000, category: 'archives', subcategory: 'Newspaper Clippings', access_level: 'universal', storage_backend: 'base44', file_url: '', summary: 'Demo archive document' },
    ],
    // Archive history so the Archives training tour has something to read
    ArchiveTimelineItem: [
      { title: 'Candora Opens Its Doors (Demo)', year: 1994, month: 9, day: 6, era: 'founding', category: 'founding', summary: 'A demonstration record for the history timeline (Test Mode).', detailed_content: '<p>Simulated archive entry used by the Archives training module. Nothing here is real.</p>', media: [], is_featured: true },
      { title: 'The Kitchen Reopens After the Flood (Demo)', year: 2007, month: 4, era: 'growth', category: 'crisis_response', summary: 'A demonstration record showing a crisis response entry (Test Mode).', detailed_content: '<p>Simulated archive entry used by the Archives training module.</p>', media: [], is_featured: true },
      { title: 'New Building on 118 Avenue (Demo)', year: 2019, month: 6, era: 'expansion', category: 'building_expansion', summary: 'A demonstration record for a building expansion (Test Mode).', detailed_content: '<p>Simulated archive entry used by the Archives training module.</p>', media: [], is_featured: false },
    ],
    ArchiveBio: [
      { person_name: 'Demo Founder', role_title: 'founder', role_label: 'Founding Executive Director', term_start: '1994-09-01', term_end: '2003-06-30', is_current: false, bio_content: '<p>Simulated biography used by the Archives training module.</p>', highlights: ['Opened the first location', 'Built the first board'] },
      { person_name: 'Demo Director', role_title: 'executive_director', term_start: '2016-01-01', is_current: true, bio_content: '<p>Simulated biography used by the Archives training module.</p>', highlights: ['Launched the employment programs'] },
    ],
    ArchiveStory: [
      { title: 'The Year the Money Ran Out (Demo)', content: '<p>Simulated story used by the Archives training module — the kind of account a story entry holds.</p>', story_date: '2001-11-15', era: 'The Early Years', author: 'Demo Curator', media: [], is_featured: true, order_index: 0 },
      { title: 'The First Graduating Class (Demo)', content: '<p>Simulated story used by the Archives training module.</p>', story_date: '1998-06-20', era: 'The Early Years', author: 'Demo Curator', media: [], is_featured: false, order_index: 1 },
    ],
    Reminder: [
      { title: 'Demo reminder', due_date: D(-2), is_completed: false },
    ],
    PersonalOrganizer: [
      { title: 'Demo organizer task', category: 'task', is_completed: false, due_date: D(-1) },
    ],
    // Mirrors the live Portal tab so testing looks like the real thing.
    PortalCard: [
      { name: 'Candora Archives', description: 'Organization history and records', url: '/archives', icon: 'Archive', category: 'administration', sort_order: 90, is_enabled: true },
      { name: 'Candora Board', description: 'Meetings, minutes and board documents', url: '/board', icon: 'Gavel', category: 'administration', sort_order: 90, is_enabled: true },
      { name: 'Community Programs', description: 'Community programs and participants', url: '/community', icon: 'Heart', category: 'operations', sort_order: 62, is_enabled: true },
      { name: 'Digital Literacy', description: 'Digital literacy program', url: '/digilit', icon: 'Monitor', category: 'operations', sort_order: 61, is_enabled: true },
      { name: 'Childminding', description: 'Childminding records and sessions', url: '/childminding', icon: 'Baby', category: 'operations', sort_order: 60, is_enabled: true },
      { name: 'Reception', description: 'Front desk portal', url: '/reception', icon: 'ConciergeBell', category: 'operations', sort_order: 59, is_enabled: true },
      { name: 'EmpowerU', description: 'Cohorts, participants and waitlist', url: '/empoweru', icon: 'PiggyBank', category: 'operations', sort_order: 58, is_enabled: true },
      { name: 'Candora Central Database', description: 'Central client database', url: '/rc', icon: 'LifeBuoy', category: 'operations', sort_order: 57, is_enabled: true },
      { name: 'Resource Worker Portal', description: 'Simplified case management', url: '/rworker', icon: 'LifeBuoy', category: 'operations', sort_order: 56, is_enabled: true },
      { name: 'PHAC Programs', description: 'Parent-child drop-in programs', url: '/phac', icon: 'Baby', category: 'operations', sort_order: 56, is_enabled: true },
      { name: 'FRN Programs', description: 'Family resource network programs', url: '/frn', icon: 'Users', category: 'operations', sort_order: 55, is_enabled: true },
      { name: 'ELL Program Manager', description: 'English language learning', url: '/ell', icon: 'GraduationCap', category: 'operations', sort_order: 50, is_enabled: true },
      { name: 'Grant / Proposal Manager', description: 'Grants, funding and proposals', url: '/grants', icon: 'BookOpen', category: 'operations', sort_order: 50, is_enabled: true },
      { name: 'Reports Portal', description: 'Internal and funder reporting', url: '/reporting', icon: 'FileText', category: 'operations', sort_order: 45, is_enabled: true },
      { name: 'Marketing & Fundraising', description: 'Marketing, donors and media', url: '/marketing', icon: 'Megaphone', category: 'operations', sort_order: 40, is_enabled: true },
      { name: 'Food Services', description: 'Menu, orders and inventory', url: '/food', icon: 'UtensilsCrossed', category: 'operations', sort_order: 35, is_enabled: true },
      { name: 'Pathways CM', description: 'Case management', url: '/pathways', icon: 'Compass', category: 'hr', sort_order: 30, is_enabled: true },
      { name: 'Volunteer Manager', description: 'Volunteers, events and hours', url: '/volunteermgr', icon: 'Heart', category: 'hr', sort_order: 20, is_enabled: true },
      { name: 'Winter Wonderland Festival', description: 'Festival components and schedule', url: '/winter-wonderland', icon: 'Snowflake', category: 'operations', sort_order: 15, is_enabled: true },
      { name: 'Finance Portal', description: 'Payroll, invoices and budgets', url: '/finance', icon: 'Wallet', category: 'finance', sort_order: 10, is_enabled: true },
      { name: 'Outlook', description: 'Email and calendar', url: '/outlook', icon: 'Mail', category: 'communications', sort_order: 5, is_enabled: true },
      { name: 'Job Lab', description: 'Employment centre portal', url: '/joblab', icon: 'Briefcase', category: 'operations', sort_order: 5, is_enabled: true },
      { name: 'Admin Console', description: 'Manage portal cards and widgets', url: '/admin/cards', icon: 'Settings', category: 'administration', sort_order: 1, is_enabled: true },
      { name: 'File Manager', description: 'Files, folders and collections', url: '/filemanager', icon: 'FolderOpen', category: 'operations', sort_order: 1, is_enabled: true },
      { name: 'HR Management', description: 'Employees, reviews and documents', url: '/nexushr', icon: 'Users', category: 'hr', sort_order: 1, is_enabled: true },
      { name: 'Executive Director Portal', description: 'Tasks, KPIs and board reporting', url: '/ed', icon: 'Crown', category: 'administration', sort_order: 0, is_enabled: true },
      { name: 'Events/Projects/Programs Manager', description: 'Events, projects and programs', url: '/eventsmgr', icon: 'Calendar', category: 'operations', sort_order: 0, is_enabled: true },
      { name: 'Learning Management System', description: 'Training modules and programs', url: '/lms', icon: 'GraduationCap', category: 'administration', sort_order: 0, is_enabled: true },
      { name: 'Central Registration', description: 'Registrations, waitlists and calendar', url: '/central-registration', icon: 'ClipboardCheck', category: 'operations', sort_order: 0, is_enabled: true },
    ],
  };
  // Merge in the richer priority-portal seeds (Pathways, Central Database,
  // ELL, Central Registration). Records with a supplied `id` keep it, so
  // cross-entity references resolve inside Test Mode.
  const merged = { ...base };
  for (const [entity, rows] of Object.entries(PRIORITY_DEMO)) {
    merged[entity] = [...(merged[entity] || []), ...rows];
  }
  return merged;
}

// Seeded records carry the demo worker identity (Terry Tester / test.user@…).
// To make "my" dashboards (assigned-worker lists, tasks, requests...) show
// demo data for whoever is testing, the seeds are rewritten to the signed-in
// user's real name/email before the first read.
const DEMO_EMAIL = 'test.user@candora.ca';
const DEMO_NAME = 'Terry Tester';
let realEmail = '';
let realName = '';

function personalize(value) {
  if (typeof value === 'string') {
    if (value === DEMO_EMAIL) return realEmail || value;
    if (value === DEMO_NAME) return realName || value;
    return value;
  }
  if (Array.isArray(value)) return value.map(personalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = personalize(v);
    return out;
  }
  return value;
}

function seedEntity(entity) {
  const map = demoData();
  const seeds = map[entity] || [];
  db.set(entity, seeds.map((fields) => ({
    id: mkId(entity),
    created_date: now(),
    updated_date: now(),
    created_by_id: 'test-user',
    ...personalize(fields),
  })));
}

const rowsOf = (entity) => {
  if (!db.has(entity)) seedEntity(entity);
  return db.get(entity);
};

// ── Query engine (mirrors the SDK's MongoDB-ish operators) ─────────────────
const strEq = (a, b) =>
  a === b || (a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b));

function cmp(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  const da = Date.parse(sa);
  const dbv = Date.parse(sb);
  if (!Number.isNaN(da) && !Number.isNaN(dbv) && /\d{4}/.test(sa) && /\d{4}/.test(sb)) return da - dbv;
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function matches(record, query) {
  if (!query || typeof query !== 'object') return true;
  return Object.entries(query).every(([key, cond]) => {
    if (key === '$or') return Array.isArray(cond) && cond.some((sub) => matches(record, sub));
    if (key === '$and') return Array.isArray(cond) && cond.every((sub) => matches(record, sub));
    const val = record[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      return Object.entries(cond).every(([op, v]) => {
        switch (op) {
          case '$in': return (v || []).some((x) => strEq(val, x));
          case '$nin': return !(v || []).some((x) => strEq(val, x));
          case '$ne': return !strEq(val, v);
          case '$gt': return cmp(val, v) > 0;
          case '$gte': return cmp(val, v) >= 0;
          case '$lt': return cmp(val, v) < 0;
          case '$lte': return cmp(val, v) <= 0;
          case '$exists': return v ? (val !== undefined && val !== null) : (val === undefined || val === null);
          case '$regex': return new RegExp(v, 'i').test(String(val ?? ''));
          default: return true;
        }
      });
    }
    return strEq(val, cond);
  });
}

function sortRecords(records, sort) {
  if (!sort) return records;
  let dir = 1;
  let field = sort;
  if (typeof sort === 'string' && sort.startsWith('-')) { dir = -1; field = sort.slice(1); }
  return [...records].sort((x, y) => dir * cmp(x[field], y[field]));
}

function paginate(records, opts = {}) {
  const sorted = sortRecords(records, opts.sort);
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;
  const start = opts.cursor ? parseInt(opts.cursor, 10) || 0 : 0;
  const items = sorted.slice(start, start + limit);
  const has_more = start + limit < sorted.length;
  return { items, next_cursor: has_more ? String(start + limit) : null, has_more };
}

// ── Per-entity collection ──────────────────────────────────────────────────
function makeCollection(entity) {
  return {
    async list(a, b) {
      const recs = rowsOf(entity);
      if (a && typeof a === 'object' && !Array.isArray(a)) {
        if (a.distinct) {
          const vals = recs.map((r) => r[a.distinct]).filter((v) => v !== undefined && v !== null && v !== '');
          return { items: [...new Set(vals)] };
        }
        return paginate(recs, a);
      }
      const sorted = typeof a === 'string' ? sortRecords(recs, a) : recs;
      return typeof b === 'number' ? sorted.slice(0, b) : sorted;
    },
    async filter(query, opts, maybeLimit) {
      const matched = rowsOf(entity).filter((r) => matches(r, query));
      // Legacy call shape filter(query, sort, limit) → plain array (the real
      // SDK supports this; callers like PathwaysWorkerDashboard do .find on it)
      if (opts && typeof opts !== 'object') {
        const sorted = sortRecords(matched, opts);
        return typeof maybeLimit === 'number' ? sorted.slice(0, maybeLimit) : sorted;
      }
      return opts ? paginate(matched, opts) : matched;
    },
    async get(id) {
      const rec = rowsOf(entity).find((r) => r.id === id || r.id === String(id));
      if (!rec) throw new Error(`${entity} record not found (Test Mode)`);
      return rec;
    },
    async create(data) {
      const rec = { id: mkId(entity), created_date: now(), updated_date: now(), created_by_id: 'test-user', ...data };
      rowsOf(entity).push(rec);
      return rec;
    },
    async bulkCreate(items) {
      const created = (items || []).map((d) => {
        const rec = { id: mkId(entity), created_date: now(), updated_date: now(), created_by_id: 'test-user', ...d };
        rowsOf(entity).push(rec);
        return rec;
      });
      return created;
    },
    async update(id, data) {
      const rec = rowsOf(entity).find((r) => r.id === id || r.id === String(id));
      if (!rec) throw new Error(`${entity} record not found (Test Mode)`);
      Object.assign(rec, data, { updated_date: now() });
      return rec;
    },
    async bulkUpdate(items) {
      const out = [];
      for (const { id, ...data } of items || []) {
        const rec = rowsOf(entity).find((r) => r.id === id || r.id === String(id));
        if (rec) { Object.assign(rec, data, { updated_date: now() }); out.push(rec); }
      }
      return out;
    },
    async updateMany(query, ops = {}) {
      const matched = rowsOf(entity).filter((r) => matches(r, query));
      const set = ops.$set || {};
      for (const r of matched) {
        Object.assign(r, set, { updated_date: now() });
        if (ops.$inc) for (const [k, v] of Object.entries(ops.$inc)) r[k] = (Number(r[k]) || 0) + v;
        if (ops.$unset) for (const k of Object.keys(ops.$unset)) delete r[k];
        if (ops.$push) for (const [k, v] of Object.entries(ops.$push)) (r[k] = r[k] || []).push(v);
        if (ops.$addToSet) for (const [k, v] of Object.entries(ops.$addToSet)) { r[k] = r[k] || []; if (!r[k].some((x) => strEq(x, v))) r[k].push(v); }
        if (ops.$pull) for (const [k, v] of Object.entries(ops.$pull)) { if (Array.isArray(r[k])) r[k] = r[k].filter((x) => !strEq(x, v)); }
      }
      return { modified: matched.length, has_more: false };
    },
    async delete(id) {
      const arr = rowsOf(entity);
      const i = arr.findIndex((r) => r.id === id || r.id === String(id));
      if (i === -1) throw new Error(`${entity} record not found (Test Mode)`);
      return arr.splice(i, 1)[0];
    },
    async deleteMany(query) {
      const arr = rowsOf(entity);
      const keep = arr.filter((r) => !matches(r, query));
      const removed = arr.length - keep.length;
      db.set(entity, keep);
      return removed;
    },
    async count(query) {
      return query ? rowsOf(entity).filter((r) => matches(r, query)).length : rowsOf(entity).length;
    },
    async aggregate({ query, groupBy, sum = [], avg = [], min = [], max = [] } = {}) {
      const matched = rowsOf(entity).filter((r) => matches(r, query));
      const tally = (list) => {
        const row = { count: list.length };
        for (const f of sum) row[`sum_${f}`] = list.reduce((s, r) => s + (Number(r[f]) || 0), 0);
        for (const f of avg) row[`avg_${f}`] = list.length ? +(list.reduce((s, r) => s + (Number(r[f]) || 0), 0) / list.length).toFixed(2) : 0;
        for (const f of min) row[`min_${f}`] = list.reduce((m, r) => (m === undefined || cmp(r[f], m) < 0 ? r[f] : m), undefined);
        for (const f of max) row[`max_${f}`] = list.reduce((m, r) => (m === undefined || cmp(r[f], m) > 0 ? r[f] : m), undefined);
        return row;
      };
      if (!groupBy) return { rows: [tally(matched)] };
      const groups = new Map();
      for (const r of matched) {
        const key = r[groupBy] ?? null;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      return { rows: [...groups.entries()].map(([key, list]) => ({ [groupBy]: key, ...tally(list) })) };
    },
    subscribe() {
      return () => {};
    },
  };
}

const entitiesProxy = new Proxy({}, {
  get(target, name) {
    if (typeof name !== 'string') return undefined;
    // Training progress always persists to the REAL database, even while the
    // rest of the app runs on simulated Test Mode data — so completed
    // training survives the end of a training session. E-signature records
    // persist too: the PIN and signature a learner sets up during training is
    // their real, usable e-signature — not something they must redo later.
    const PERSIST_ENTITIES = new Set(['TrainingProgress', 'ESignatureProfile', 'SavedESignature']);
    if (PERSIST_ENTITIES.has(name) && realEntitiesRef?.[name]) return realEntitiesRef[name];
    if (!target[name]) target[name] = makeCollection(name);
    return target[name];
  },
});

// ── Simulated integrations (live-service calls report success, do nothing) ──
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function schemaDefault(schema) {
  if (!schema || typeof schema !== 'object') return 'Simulated (Test Mode)';
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  switch (schema.type) {
    case 'array': return [];
    case 'number':
    case 'integer': return 0;
    case 'boolean': return false;
    case 'string': return 'Simulated (Test Mode)';
    default:
      if (schema.properties) {
        const out = {};
        for (const [k, v] of Object.entries(schema.properties)) out[k] = schemaDefault(v);
        return out;
      }
      return {};
  }
}

const coreSim = {
  InvokeLLM: async ({ response_json_schema } = {}) =>
    response_json_schema
      ? schemaDefault(response_json_schema)
      : 'This is a simulated AI response generated in Test Mode. No real data was used and nothing was saved.',
  UploadPrivateFile: async ({ file } = {}) => ({ file_uri: `test-mode://uploads/${file?.name || 'file'}` }),
  UploadPublicFile: async ({ file } = {}) => ({ file_url: PIXEL }),
  CreateFileSignedUrl: async () => ({ signed_url: 'data:text/plain;base64,VGVzdCBNb2RlIC0gbm8gcmVhbCBmaWxlIGNvbnRlbnQ=' }),
  GenerateImage: async () => ({ url: PIXEL }),
  GenerateSpeech: async () => ({ url: 'data:audio/mpeg;base64,' }),
  GenerateVideo: async () => ({ url: 'data:video/mp4;base64,' }),
  SendEmail: async () => ({ success: true }),
  TranscribeAudio: async () => 'Simulated transcript (Test Mode).',
  ExtractDataFromUploadedFile: async () => ({ status: 'success', output: [] }),
};

const coreProxy = new Proxy(coreSim, {
  get(target, name) {
    if (typeof name !== 'string') return undefined;
    return target[name] || (async () => ({ success: true, simulated: true }));
  },
});

// ── Simulated backend functions ────────────────────────────────────────────
async function invokeSim(name) {
  if (name === 'getMyPermissions') {
    let email = '';
    try { const u = await realClient.auth.me(); email = u.email || ''; } catch { /* ignore */ }
    return {
      data: {
        permissions: MODULE_IDS.map((m) => ({
          target_type: 'module',
          target_id: m,
          scope_type: 'individual',
          scope_value: email,
          permission: 'allow',
          is_active: true,
        })),
      },
    };
  }
  return {
    status: 'success',
    simulated: true,
    message: 'Simulated in Test Mode — no real action was taken.',
    data: {},
    items: [],
    results: [],
  };
}

const usersSim = { inviteUser: async () => ({ success: true, simulated: true }) };
const analyticsSim = { track: () => {} };

// ── Installer ──────────────────────────────────────────────────────────────
// ── Journey module demo state ─────────────────────────────────────────────
// Part 1 of the Pathways Client Journey shows Sam Specimen with no plan yet
// (the Create Action Plan walkthrough); Part 2 follows the same Sam with a
// built WD plan and an active internal placement. The base seed is the
// Part-1 state — opening a journey tour applies or reverts the plan patch so
// one demo client serves both modules.
const SAM_JOURNEY_FIELDS = () => ({
  action_plan_submitted: true,
  sdp_items: ['job_search_workshop', 'resume_writing_workshop', 'workplace_readiness_workshop', 'internal_placement'],
  sdp_item_details: {
    job_search_workshop: { timeline_start: D(42), timeline_end: D(28) },
    resume_writing_workshop: { timeline_start: D(24), timeline_end: D(-10) },
    workplace_readiness_workshop: { timeline_start: D(7), timeline_end: D(-28) },
  },
  roadmap_item_status: {
    job_search_workshop: { status: 'completed', started_date: D(42), completed_date: D(28) },
    resume_writing_workshop: { status: 'started', started_date: D(23) },
    workplace_readiness_workshop: { status: 'planned' },
  },
  roadmap_progress_notes: [
    { id: 'sam-demo-note-2', date: D(27), event_type: 'eda', item_label: 'Job Search Workshop', item_key: 'job_search_workshop', note: 'Completed the full workshop series.', logged_by: 'test.user@candora.ca', logged_by_name: 'Terry Tester', compass_entered: true },
    { id: 'sam-demo-note-1', date: D(15), event_type: 'started', item_label: 'Internal Placement', item_key: 'internal_placement', note: 'Started the ARC cleaning crew placement, Mon/Wed/Fri mornings with Dana Demo.', logged_by: 'test.user@candora.ca', logged_by_name: 'Terry Tester', compass_entered: true },
  ],
});

const SAM_JOURNEY_PLACEMENT = () => ({
  client_id: 'demo-pw-sam', client_name: 'Sam Specimen', placement_type: 'cleaning_arc',
  assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester',
  supervisor_name: 'Dana Demo', supervisor_email: 'test.admin@candora.ca',
  referral_date: D(20), start_date: D(15), expected_end_date: D(-30), status: 'active',
  orientation_completed: true, orientation_date: D(15),
  health_safety_completed: true, health_safety_completed_date: D(15), health_safety_date: D(15),
  training_goals: 'Build workplace routines, references and Canadian work experience',
  transportation: 'transit_pass_provided',
});

export function applyJourneyDemoState(moduleKey) {
  if (!isTestMode()) return;
  if (moduleKey !== 'pathways_journey' && moduleKey !== 'pathways_journey_part2') return;
  const sam = rowsOf('Client').find((r) => r.id === 'demo-pw-sam');
  if (!sam) return;
  const placements = rowsOf('InternalTraining');
  if (moduleKey === 'pathways_journey_part2') {
    if (sam.action_plan_submitted) return;
    Object.assign(sam, personalize(SAM_JOURNEY_FIELDS()));
    if (!placements.some((r) => r.client_id === 'demo-pw-sam')) {
      placements.push(personalize(SAM_JOURNEY_PLACEMENT()));
    }
  } else {
    if (!sam.action_plan_submitted) return;
    for (const key of Object.keys(SAM_JOURNEY_FIELDS())) delete sam[key];
    for (let i = placements.length - 1; i >= 0; i--) {
      if (placements[i].client_id === 'demo-pw-sam') placements.splice(i, 1);
    }
  }
}

export function installTestModeInterceptor(client) {
  realClient = client;
  realEntitiesRef = client.entities;
  realIntegrationsRef = client.integrations;
  const swap = (prop, value) => {
    try {
      Object.defineProperty(client, prop, { get: () => value, configurable: true });
    } catch {
      try { client[prop] = value; } catch { /* leave as-is */ }
    }
  };
  swap('entities', entitiesProxy);
  swap('integrations', { Core: coreProxy });
  swap('functions', { invoke: invokeSim });
  swap('users', usersSim);
  swap('analytics', analyticsSim);
  swap('asServiceRole', {
    entities: entitiesProxy,
    integrations: { Core: coreProxy },
    functions: { invoke: invokeSim },
    auth: client.auth,
  });
  // Capture the signed-in user's identity so seeded demo records can be
  // reassigned to them ("my clients/tasks" dashboards).
  try {
    const origMe = client.auth.me.bind(client.auth);
    client.auth.me = async () => {
      const me = await origMe();
      if (me) {
        realEmail = (me.email || '').toLowerCase();
        realName = me.full_name || '';
      }
      return me;
    };
  } catch { /* leave as-is */ }
  // Profile edits in Test Mode must not touch the real account.
  try {
    client.auth.updateMe = async () => {
      try { return await client.auth.me(); } catch { return {}; }
    };
  } catch { /* leave as-is */ }
}