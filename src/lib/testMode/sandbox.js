// ── Test Mode sandbox ──────────────────────────────────────────────────────
// When Test Mode is on, the pre-initialized base44 client's data layers
// (entities, functions, integrations, users, analytics) are swapped for
// in-memory simulations. Nothing is ever sent to the backend: reads return
// auto-generated demo records, writes mutate only the in-memory store, and
// live-service calls (email, AI, SharePoint/Excel writes...) report simulated
// success. Test data lives only in this browser tab's memory — it is never
// stored and disappears when Test Mode is turned off (the toggle reloads
// the app so no live data stays cached).

const SESSION_KEY = 'candora-test-mode';

export const isTestMode = () => {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

// Toggling reloads the app so no live data remains in memory or query caches.
export const setTestMode = (on) => {
  try { sessionStorage.setItem(SESSION_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  window.location.reload();
};

let realClient = null;

// ── In-memory database ─────────────────────────────────────────────────────
const db = new Map();
let idCounter = 0;
const now = () => new Date().toISOString();
const mkId = (entity) => `test_${entity.toLowerCase().replace(/[^a-z0-9]/g, '')}_${++idCounter}`;
const D = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

// Minimal demo data — a couple of fake records per portal so screens aren't
// blank. Anything not listed here starts empty and is created in-memory as
// you use Test Mode.
function demoData() {
  return {
    Announcement: [
      { title: 'Welcome to Test Mode', content: 'You are viewing simulated data. Nothing here is real, and nothing you change is saved to the live portal.', category: 'general', priority: 'high', is_active: true, publish_date: D(0) },
      { title: 'Staff lunch on Friday', content: 'Demo announcement for Test Mode.', category: 'event', priority: 'low', is_active: true, publish_date: D(2) },
    ],
    OrgSettings: [
      { org_name: 'Candora (Test Mode)', welcome_message: 'Welcome to Test Mode — simulated data only', primary_color: '#f5c116', secondary_color: '#0f1f6b', logos: [] },
    ],
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
    ],
    Client: [
      { first_name: 'Casey', last_name: 'Sample', compass_hsid: '10001', service_type: 'pathways', program_status: 'in_progress', status: 'new', service_start_date: D(30), counsellor_name: 'Terry Tester', phone: '780-555-0101', email: 'casey.sample@example.ca' },
      { first_name: 'Jordan', last_name: 'Example', compass_hsid: '10002', service_type: 'direct_to_employment', program_status: 'complete', status: 'new', service_start_date: D(120), eda_completion_date: D(20), counsellor_name: 'Terry Tester', phone: '780-555-0102', email: 'jordan.example@example.ca' },
      { first_name: 'Sam', last_name: 'Specimen', compass_hsid: '10003', service_type: 'pathways', program_status: 'waitlisted', status: 'new', counsellor_name: '', phone: '780-555-0103', email: 'sam.specimen@example.ca' },
    ],
    RCClient: [
      { first_name: 'Riley', last_name: 'Rehearsal', phone: '780-555-0201', email: 'riley@example.ca', status: 'active', notes: 'Demo client for Test Mode' },
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
      { participant_name: 'Priya Practice', cohort_name: 'EmpowerU Test Cohort', status: 'appointment_scheduled', savings_amount: 300 },
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
    FRNSession: [
      { name: 'FRN Demo Session', date: D(7), location: 'Small Classroom', status: 'scheduled' },
    ],
    PHACParticipant: [
      { child_first_name: 'Pat', child_last_name: 'Prototype', parent_guardian_name: 'Parent Prototype', parent_guardian_phone: '780-555-0701', parent_guardian_email: 'parent@example.ca', status: 'registered', first_visit_date: D(14) },
      { child_first_name: 'Kit', child_last_name: 'Kindling', parent_guardian_name: 'Guardian Kindling', parent_guardian_phone: '780-555-0702', parent_guardian_email: 'guardian@example.ca', status: 'waitlisted' },
    ],
    PHACSession: [
      { name: 'PHAC Demo Session', date: D(6), location: 'ARC', status: 'scheduled' },
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
    ],
    TimeOffRecord: [
      { employee_name: 'Terry Tester', employee_email: 'test.user@candora.ca', type: 'vacation', start_date: D(-10), end_date: D(-5), status: 'pending' },
      { employee_name: 'Dana Demo', employee_email: 'test.admin@candora.ca', type: 'sick', start_date: D(3), end_date: D(3), status: 'approved' },
    ],
    StaffReimbursementRequest: [
      { staff_name: 'Terry Tester', staff_email: 'test.user@candora.ca', amount: 42.5, status: 'submitted', submitted_date: D(5), description: 'Demo supplies (Test Mode)' },
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
    Reminder: [
      { title: 'Demo reminder', due_date: D(-2), is_completed: false },
    ],
    PersonalOrganizer: [
      { title: 'Demo organizer task', category: 'task', is_completed: false, due_date: D(-1) },
    ],
    PortalCard: [
      { title: 'Pathways', description: 'Case management (demo card)', is_enabled: true, order_index: 1, path: '/pathways' },
      { title: 'Grants', description: 'Grant & proposal manager (demo card)', is_enabled: true, order_index: 2, path: '/grants' },
      { title: 'Resource Centre', description: 'Central database (demo card)', is_enabled: true, order_index: 3, path: '/rc' },
      { title: 'Finance', description: 'Finance portal (demo card)', is_enabled: true, order_index: 4, path: '/finance' },
    ],
  };
}

function seedEntity(entity) {
  const map = demoData();
  const seeds = map[entity] || [];
  db.set(entity, seeds.map((fields) => ({
    id: mkId(entity),
    created_date: now(),
    updated_date: now(),
    created_by_id: 'test-user',
    ...fields,
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
    async filter(query, opts) {
      const matched = rowsOf(entity).filter((r) => matches(r, query));
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
// Every module gets an individual allow permission in Test Mode so any staff
// member can open any portal and exercise it on demo data.
const MODULE_IDS = [
  'pathways', 'grants', 'finance', 'rc', 'ell', 'empoweru', 'phac', 'frn',
  'digilit', 'community', 'centralreg', 'childminding', 'winterwonderland',
  'lms', 'reception', 'board', 'nexushr', 'volunteermgr', 'marketing',
  'eventsmgr', 'reporting', 'food', 'filemanager', 'outlook', 'archives',
  'presentations',
];

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
export function installTestModeInterceptor(client) {
  realClient = client;
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
  // Profile edits in Test Mode must not touch the real account.
  try {
    client.auth.updateMe = async () => {
      try { return await client.auth.me(); } catch { return {}; }
    };
  } catch { /* leave as-is */ }
}