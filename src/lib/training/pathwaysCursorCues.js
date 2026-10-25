const t = (name) => ({ selector: `[data-tour="${name}"]` });
const cue = (at, name, options = {}) => ({ at, target: t(name), ...options });
const flow = ['pw-tab-flow'];
const progress = [...flow, 'pw-flow-progress', 'pw-roadmap-timeline'];

// Phrases locate each intended movement in the spoken slide. These are content
// cues, not a tour of every selector that happens to share a highlighted card.
export const PATHWAYS_JOURNEY_CUES = {
  'One intake, many roads': { cues: [cue(0, 'pw-dash-tabs')] },
  'Every journey starts at Intake': { cues: [cue(0, 'pw-intake-new-client')] },
  'Intake — the Job Lab: what the client sees': { cues: [cue(0, 'pw-ext-hero'), cue('section by section', 'pw-ext-personal')] },
  'The form: personal information': { cues: [cue(0, 'pw-ext-personal')] },
  'The form: status, language and education': { cues: [cue(0, 'pw-ext-citizenship'), cue('the education section', 'pw-ext-education')] },
  'The form: employment history and eligibility': { cues: [cue(0, 'pw-ext-employment'), cue('Below that sit the eligibility questions', 'pw-ext-eligibility')] },
  'The form: transportation, background and documents': { cues: [cue(0, 'pw-ext-transport'), cue('criminal record and SIN', 'pw-ext-background'), cue('The resume section', 'pw-ext-resume')] },
  'The form: career goals and circumstances': { cues: [cue(0, 'pw-ext-goals'), cue('one more optional question', 'pw-ext-additional')] },
  "The Job Lab attendant's part": { cues: [cue(0, 'pw-ext-ack'), cue("From here it's the attendant's turn", 'pw-ext-office'), cue('four-digit access code', 'pw-ext-submit'), cue("The attendant's observations matter too", 'pw-ext-office')] },
  'Intake — Compass referrals': { cues: [cue(0, 'pw-intake-cec'), cue('this New Client button', 'pw-intake-new-client')] },
  'Barrier Identification — the Service Navigator': { cues: [cue(0, 'pw-intake-assessment'), cue('press Assess', 'pw-intake-assess-btn')] },
  'The Employment Readiness Assessment (ERA)': { cues: [{ at: 0, target: { selector: '[data-tour-path="/pathways/compass"]' } }] },
  'The determination: WD, DEA or not eligible': {
    cleanup: { selector: '[data-tour="pw-determination-dialog"] > button' },
    cues: [cue(0, 'pw-intake-determination'),
      cue('Press the Determination/Assignment button', 'pw-intake-determination-btn', { click: true, after: t('pw-determination-dialog') }),
      cue('once the determination is made', 'pw-determination-wd', { click: true }),
      cue('assign the client to a career counsellor', 'pw-determination-continue', { click: true, after: t('pw-determination-counsellor') })],
  },
  'After the determination — where the client appears': { setup: ['pw-dash-clients'], cues: [cue(0, 'pw-placement-tabs'), cue('My Dashboard too', 'pw-dash-clients')] },
  'The Employment Action Plan — where it lives': { setup: flow, cues: [cue(0, 'pw-tab-flow'), cue("the program's steps are listed", 'pw-flow-steps'), cue('The Action Plan step', 'pw-flow-plan-step')] },
  // The action-plan section is observer mode: narration only, no clicks. The
  // learner builds a plan themselves in the end-of-module practice runs.
  'Starting the plan': { setup: flow, cues: [cue(0, 'pw-flow-create-plan')] },
  "Jordan's action plan — built for his scenario": { setup: flow, cues: [cue(0, 'pw-plan-subitems'), cue('Job Search Workshop', 'pw-plan-subitem-dea_dea-jordan-1'), cue('Interview Skills Workshop', 'pw-plan-subitem-dea_dea-jordan-2'), cue('one-on-one career counselling', 'pw-plan-subitem-dea_dea-jordan-3')] },
  'Practice Run 1 — the full road from intake': { cues: [cue(0, 'pw-intake-new-client')] },
  'Practice Runs 2 and 3 — from Awaiting Assessment': { cues: [cue(0, 'pw-intake-assessment'), cue('CEC Referral badge', 'pw-intake-cec')] },
  'The Program Progress tab — the clear picture': { setup: flow, cues: [cue(0, 'pw-flow-progress'), cue('Click Program Progress', 'pw-flow-progress', { click: true, after: t('pw-roadmap') }), cue('with milestones', 'pw-roadmap-milestones')] },
  'How the timeline works': { setup: progress, cues: [cue(0, 'pw-roadmap-months'), cue('each item is a bar', 'pw-roadmap-items'), cue('colour-coded', 'pw-roadmap-legend'), cue('set by clicking it', 'pw-roadmap-first-item', { click: true, after: t('pw-roadmap-item-panel') }), cue('The Program Start date', 'pw-roadmap-start-date')] },
  "Jordan's road to completion": { setup: progress, cues: [cue(0, 'pw-roadmap-items'), cue('progress notes recording', 'pw-roadmap-notes'), cue('his employer, job title', 'pw-tab-employment', { click: true, after: t('pw-employment-content') }), cue('the timeline ends', 'pw-tab-flow', { click: true, after: t('pw-roadmap-milestones') })] },
  "The 90-Day Follow-Up — every road's last milestone": { setup: flow, cues: [cue(0, 'pw-flow-followup'), cue('step appears in the steps list', 'pw-flow-followup', { click: true, after: t('pw-followup-panel') }), cue('the date alert counts down', 'pw-followup-due'), cue('Saving writes the follow-up', 'pw-followup-save')] },
  "Program Status — moving the file through its stages": { setup: progress, cues: [cue(0, 'pw-program-status-menu'), cue('the exact phase', 'pw-program-status-panel'), cue("the menu's undo steps back", 'pw-program-status-menu')] },
  "Sam's internal placement": { setup: ['pw-dash-clients'], cues: [cue(0, 'pw-placement-tabs'), cue('Internal Training tab', 'pw-placement-internal', { click: true })] },
  "Sam's action plan — the WD road's first stretch": { setup: flow, cues: [cue(0, 'pw-plan-subitems'), cue('a longer set of Employment Development Activities', 'pw-plan-subitems'), cue('the WD window stretches', 'pw-flow-steps')] },
  "Sam's Program Progress — the placement on the timeline": { setup: flow, cues: [cue(0, 'pw-flow-progress'), cue('Open the Program Progress tab', 'pw-flow-progress', { click: true, after: t('pw-roadmap') }), cue('purple bars', 'pw-roadmap-items'), cue('the Program Status panel', 'pw-program-status-panel')] },
  "Casey's Compass tasks": { cues: [{ at: 0, target: { selector: '[data-tour-path="/pathways/compass"]' } }] },
  "Casey's purchase requests": { cues: [cue(0, 'pw-dash-tabs'), cue('Purchase Requests tab', 'pw-dash-purchases', { click: true })] },
  "Casey's progress tab": { setup: progress, cues: [cue(0, 'pw-roadmap'), cue('transportation and financial barriers', 'pw-roadmap-barriers'), { at: 'work exposure at Riverside Logistics', target: { selector: '[data-tour-placement="true"]' } }, cue('exposure course and employment supports', 'pw-roadmap-items'), cue('16 weeks', 'pw-roadmap-milestones')] },
  'Employment — recording outcomes': { cues: [cue(0, 'pw-tab-employment', { click: true, after: t('pw-employment-content') })] },
  'Referrals — the wider circle': { cues: [cue(0, 'pw-tab-referrals', { click: true, after: t('pw-referrals-content') })] },
  'When a client changes streams': { cues: [cue(0, 'pw-tab-switches', { click: true, after: t('pw-switches-content') }), cue('The BIT and ERA assessments', 'pw-tab-bit', { click: true, after: t('pw-assessments-content') })] },
};

export const PATHWAYS_OVERVIEW_CUES = {
  'The dashboard tabs': { cues: [cue(0, 'pw-dash-clients'), cue('Compass Queue', 'pw-dash-compass', { click: true }), cue('Purchase Requests', 'pw-dash-purchases'), cue('Monthly Narrative Report', 'pw-dash-narrative', { click: true })] },
  'Your caseload, in sections': { setup: ['pw-dash-clients'], cues: [cue(0, 'pw-placement-tabs'), cue('Internal Training', 'pw-placement-internal'), cue('Work Exposure', 'pw-placement-exposure')] },
};