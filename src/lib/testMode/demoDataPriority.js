// ── Priority-portal demo data (Test Mode) ──────────────────────────────────
// Richer sample records for the priority portals: Pathways CM, the Central
// Database (Resource Centre), ELL and Central Registration. Seeds use stable
// ids (the seed spread keeps a supplied `id`) so records cross-reference each
// other and detail pages open correctly inside Test Mode.

const D = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

export const PRIORITY_DEMO = {
  // ── Pathways CM ────────────────────────────────────────────────────────
  Client: [
    { id: 'test_pc_maria', first_name: 'Maria', last_name: 'Rivera', compass_hsid: '10011', phone: '780-555-1101', email: 'maria.rivera@example.ca', service_type: 'pathways', program_status: 'in_progress', status: 'active', service_start_date: D(60), assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', counsellor_name: 'Terry Tester', residency_status: 'permanent_resident', clb_level: 'clb_6', employment_status: 'UE', highest_education: 'college_diploma', legally_entitled_to_work: 'yes', has_phone_access: 'yes', available_immediately: 'yes', referral_source: 'external_agency', barrier_1: 'Childcare', barrier_1_status: 'in_progress', barrier_1_action_steps: 'Explore subsidized daycare options', barrier_1_timeline_start: D(30), barrier_2: 'Transportation', barrier_2_status: 'resolved', barrier_2_resolution_notes: 'Bus pass provided', career_objectives: 'Administrative assistant role', intake_date: D(62), current_programming: 'Pathways CM', is_waitlisted: false },
    { id: 'test_pc_ahmed', first_name: 'Ahmed', last_name: 'Hassan', compass_hsid: '10012', phone: '780-555-1102', email: 'ahmed.hassan@example.ca', service_type: 'pathways', program_status: 'in_progress', status: 'active', service_start_date: D(20), assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', residency_status: 'refugee_claimant', clb_level: 'clb_4', employment_status: 'UE-LFW', highest_education: 'bachelors_degree', legally_entitled_to_work: 'yes', has_phone_access: 'yes', has_internet_access: 'yes', referral_source: 'alberta_works', barrier_1: 'English language', barrier_1_status: 'in_progress', barrier_1_action_steps: 'Attend CLB 5 evening class', intake_date: D(22), is_waitlisted: false },
    { id: 'test_pc_emily', first_name: 'Emily', last_name: 'Whitehorse', compass_hsid: '10013', phone: '780-555-1103', email: 'emily.w@example.ca', service_type: 'pathways', program_status: 'complete', status: 'active', service_start_date: D(180), eda_completion_date: D(45), completion_date: D(40), employment_start_date: D(30), post_completion_employment_status: 'E-RF', post_completion_employment_date: D(30), job_title: 'Warehouse Associate', employer_name: 'Northside Logistics', job_wage: 21.5, job_hours: '40 hrs/week', employed_ftpt: 'FT', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', followup_90day_date: D(-50), followup_90day_status: 'E-RF', residency_status: 'canadian_citizen', referral_source: 'self', barrier_1: 'Work experience gap', barrier_1_status: 'resolved', intake_date: D(182), is_waitlisted: false },
    { id: 'test_pc_dmitri', first_name: 'Dmitri', last_name: 'Petrov', compass_hsid: '10014', phone: '780-555-1104', service_type: 'pathways', program_status: 'in_progress', status: 'pending', assigned_worker: 'test.user@candora.ca', assigned_worker_name: 'Terry Tester', residency_status: 'temporary_resident', employment_status: 'UE', referral_source: 'family_friend', contact_attempt_1_status: 'left_message', intake_date: D(5), is_waitlisted: false, intake_notes: 'Awaiting CLB assessment before first meeting' },
    { id: 'test_pc_grace', first_name: 'Grace', last_name: 'Kim', compass_hsid: '10015', phone: '780-555-1105', email: 'grace.kim@example.ca', service_type: 'pathways', program_status: 'in_progress', status: 'active', service_start_date: D(35), assigned_worker: 'test.admin@candora.ca', assigned_worker_name: 'Dana Demo', residency_status: 'permanent_resident', clb_level: 'clb_7', employment_status: 'UE-S', internal_placement: 'cleaning_arc', placement_start_date: D(14), placement_schedule: 'Mon/Wed/Fri mornings', highest_education: 'high_school_diploma', legally_entitled_to_work: 'yes', referral_source: 'external_agency', barrier_1: 'Canadian work experience', barrier_1_status: 'in_progress', barrier_1_action_steps: 'Internal training placement at ARC', intake_date: D(37), is_waitlisted: false },
    { id: 'test_pc_leo', first_name: 'Leo', last_name: 'Fontaine', compass_hsid: '10016', phone: '780-555-1106', service_type: 'pathways', program_status: 'in_progress', status: 'new', assigned_worker_name: '', residency_status: 'work_permit', employment_status: 'UE', referral_source: 'school', intake_date: D(1), is_waitlisted: true, waitlist_date: D(1) },
  ],
  PathwaysStaff: [
    { name: 'Terry Tester', email: 'test.user@candora.ca', role: 'career_counsellor', secondary_role: 'service_navigator', is_active: true },
    { name: 'Dana Demo', email: 'test.admin@candora.ca', role: 'manager', is_active: true },
    { name: 'Nadia Navigator', email: 'nadia.navigator@candora.ca', role: 'service_navigator', is_active: true },
  ],
  CompassTask: [
    { client_id: 'test_pc_maria', client_name: 'Maria Rivera', compass_hsid: '10011', task_type: 'assessment', title: 'Complete CLB reassessment booking', instructions: 'Book CLB reassessment and record result on the client profile.', assigned_worker_name: 'Terry Tester', status: 'pending' },
    { client_id: 'test_pc_ahmed', client_name: 'Ahmed Hassan', compass_hsid: '10012', task_type: 'follow_up', title: 'Check in after first workshop', instructions: 'Call two days after the Resume Basics workshop.', assigned_worker_name: 'Terry Tester', status: 'pending' },
    { client_id: 'test_pc_emily', client_name: 'Emily Whitehorse', compass_hsid: '10013', task_type: 'compass_entry', title: 'Enter 90-day follow-up in Compass', assigned_worker_name: 'Terry Tester', status: 'completed', completed_by_name: 'Terry Tester', completed_date: D(10), completed_notes: 'Employment confirmed — full time at Northside Logistics.' },
    { client_id: 'test_pc_grace', client_name: 'Grace Kim', compass_hsid: '10015', task_type: 'checkin', title: 'Midpoint check-in with ARC supervisor', assigned_worker_name: 'Dana Demo', status: 'pending' },
  ],
  InternalTraining: [
    { client_id: 'test_pc_grace', client_name: 'Grace Kim', placement_type: 'cleaning_arc', assigned_worker_name: 'Dana Demo', supervisor_name: 'Sam Supervisor', supervisor_email: 'supervisor@example.ca', referral_date: D(20), start_date: D(14), expected_end_date: D(-16), status: 'active', orientation_completed: true, orientation_date: D(14), health_safety_completed: true, health_safety_completed_date: D(14), health_safety_date: D(14), training_goals: 'Build routine, references and Canadian workplace experience', transportation: 'transit_pass_provided' },
    { client_id: 'test_pc_ahmed', client_name: 'Ahmed Hassan', placement_type: 'food_services_onsite', assigned_worker_name: 'Terry Tester', supervisor_name: 'Cafe Supervisor', supervisor_email: 'cafe@example.ca', referral_date: D(12), status: 'referred', training_goals: 'Practice English in a fast-paced workplace; develop customer service skills' },
    { client_id: 'test_pc_emily', client_name: 'Emily Whitehorse', placement_type: 'reception', assigned_worker_name: 'Terry Tester', referral_date: D(150), start_date: D(140), actual_end_date: D(110), status: 'completed', orientation_completed: true, orientation_date: D(140), evaluation_completed: true, evaluation_date: D(110), evaluation_reliability: 'excellent', evaluation_attitude: 'excellent', evaluation_skill_development: 'good', evaluation_teamwork: 'excellent', evaluation_communication: 'good', evaluation_would_hire: 'yes', evaluation_strengths: 'Punctual, quick learner, great with visitors' },
  ],
  Employer: [
    { id: 'test_employer_1', name: 'Northside Logistics', contact_name: 'Nadia Manager', contact_email: 'hr@northsidelogistics.example.ca', contact_phone: '780-555-1201', industry: 'Warehousing & logistics', address: '990 Container Way NE, Edmonton, AB', status: 'active', payment_payable_to: 'client', notes: 'Willing to host work-exposure placements; monthly intake possible.' },
    { id: 'test_employer_2', name: 'Café Aurora', contact_name: 'Marco Barista', contact_email: 'manager@cafeaurora.example.ca', contact_phone: '780-555-1202', industry: 'Food services', address: '45 Whyte Ave, Edmonton, AB', status: 'active', payment_payable_to: 'employer' },
    { name: 'Greenline Landscaping', contact_name: 'Pat Planter', contact_email: 'office@greenline.example.ca', contact_phone: '780-555-1203', industry: 'Landscaping', status: 'pending', notes: 'Waiting on signed participation agreement.' },
  ],
  WorkExposurePlacement: [
    { client_id: 'test_pc_emily', client_name: 'Emily Whitehorse', employer_id: 'test_employer_1', business_name: 'Northside Logistics', location: 'Container Way NE', position_type: 'Warehouse Associate', expected_hours_per_week: 40, hours_worked: 40, hourly_rate: 21.5, start_date: D(30), anticipated_completion_date: D(-60), status: 'in_progress', assigned_worker_name: 'Terry Tester' },
    { client_id: 'test_pc_maria', client_name: 'Maria Rivera', employer_id: 'test_employer_2', business_name: 'Café Aurora', location: 'Whyte Ave', position_type: 'Counter Staff', expected_hours_per_week: 20, hours_worked: 20, hourly_rate: 18, start_date: D(-90), status: 'completed', assigned_worker_name: 'Terry Tester', notes: 'Placement completed successfully; employer provided reference.' },
  ],
  PurchaseRequest: [
    { request_type: 'exposure_course', client_id: 'test_pc_ahmed', client_name: 'Ahmed Hassan', course_type: 'forklift_operator', course_identifier: 'FORK-101', program_start_date: D(-14), description: 'Forklift operator certification course', estimated_amount: 350, vendor: 'Alberta Safety Training', requested_date: D(3), requested_by_name: 'Terry Tester', status: 'pending' },
    { request_type: 'employment_supports', client_id: 'test_pc_maria', client_name: 'Maria Rivera', support_type: 'work_clothing', description: 'Steel-toed boots for warehouse placement', estimated_amount: 140, vendor: 'Workwear Depot', requested_date: D(12), requested_by_name: 'Terry Tester', status: 'approved', received_by_name: 'Dana Demo', received_date: D(9), reviewed_by_name: 'Dana Demo', reviewed_date: D(10), determination_date: D(10), purchase_date: D(8), amount_without_tax: 123.02, tax: 16.98, total: 140 },
  ],
  TransitionClient: [
    { first_name: 'Sofia', last_name: 'Andersen', phone: '780-555-1301', compass_hsid: '10021', program: 'WD', previous_counsellor: 'Lola', new_counsellor: 'Terry Tester', transition_status: 'introduced', service_status: 'action_plan_in_progress', priority: 'medium', next_checkin_date: D(-7), last_checkin_date: D(4), checkin_frequency: 'biweekly', service_start_date: D(30), file_status: 'open' },
    { first_name: 'Tobias', last_name: 'Nkemelu', phone: '780-555-1302', compass_hsid: '10022', program: 'CEIS', previous_counsellor: 'Priscilla', new_counsellor: 'Dana Demo', transition_status: 'in_progress', service_status: 'in_internal_training', priority: 'high', next_checkin_date: D(-3), last_checkin_date: D(8), checkin_frequency: 'weekly', service_start_date: D(55), dea_start_date: D(20), file_status: 'open' },
    { first_name: 'Hana', last_name: 'Osei', phone: '780-555-1303', compass_hsid: '10023', program: 'WD', previous_counsellor: 'Other', previous_counsellor_other: 'External referral', new_counsellor: 'Terry Tester', transition_status: 'completed', service_status: '90day_followup_close', priority: 'low', last_checkin_date: D(15), checkin_frequency: 'monthly', service_start_date: D(120), file_status: 'closed', close_reason: 'completed', close_date: D(10) },
  ],

  // ── Central Database (Resource Centre) ──────────────────────────────────
  RCCaseworker: [
    { staff_email: 'test.user@candora.ca', display_name: 'Terry Tester', active: true, intensive_access: true },
    { staff_email: 'test.admin@candora.ca', display_name: 'Dana Demo', active: true, intensive_access: false },
    { staff_email: 'yazmin.caseworker@example.ca', display_name: 'Yazmin Caseworker', active: true, intensive_access: false },
  ],
  RCClient: [
    { id: 'test_rc_amara', first_name: 'Amara', last_name: 'Diallo', phone: '780-555-2101', email: 'amara.diallo@example.ca', city: 'Edmonton', postal_code: 'T6A 1A1', case_status: 'active', service_category: 'intensive_services', intake_date: D(90), assigned_worker: 'Terry Tester', newcomer: true, preferred_language: 'French', additional_languages: 'English, Arabic', english_proficiency: 'acceptable', dependants_count: 2, children_count_0_6: 1, has_children_0_6: true, reason_for_accessing: 'settlement_immigration', visit_count: 8, notes: 'Settled in Edmonton six months ago; connected to ELL evening class.' },
    { id: 'test_rc_harold', first_name: 'Harold', last_name: 'Thompson', phone: '780-555-2102', case_status: 'monitoring', service_category: 'general', intake_date: D(240), assigned_worker: 'Dana Demo', senior: true, reason_for_accessing: 'emergency_food', visit_count: 15, notes: 'Regular Grab & Go visits; pension income, checking in monthly.' },
    { id: 'test_rc_bella', first_name: 'Bella', last_name: 'Cruz', phone: '780-555-2103', email: 'bella.cruz@example.ca', case_status: 'waitlisted', service_category: 'caregiver_capacity_0_5', intake_date: D(18), newcomer: true, has_children_0_6: true, children_count_0_6: 2, dependants_count: 2, reason_for_accessing: 'family_parenting_support', visit_count: 2, notes: 'Waitlisted for the caregiver capacity program; on the PHAC list.' },
    { id: 'test_rc_wesley', first_name: 'Wesley', last_name: 'Okafor', phone: '780-555-2104', case_status: 'active', service_category: 'general', intake_date: D(30), assigned_worker: 'Terry Tester', youth_under_25: true, reason_for_accessing: 'employment_income', visit_count: 4, notes: 'Looking for work; referred to Pathways intake.' },
    { id: 'test_rc_fatima', first_name: 'Fatima', last_name: 'Said', phone: '780-555-2105', email: 'fatima.said@example.ca', case_status: 'intake', service_category: 'intensive_services', intake_date: D(2), newcomer: true, preferred_language: 'Arabic', english_proficiency: 'low', dependants_count: 3, children_count_0_6: 2, has_children_0_6: true, reason_for_accessing: 'housing_concerns', visit_count: 1, notes: 'Urgent housing situation; intake in progress.' },
    { id: 'test_rc_gordon', first_name: 'Gordon', last_name: 'Lightfoot', case_status: 'closed', service_category: 'general', intake_date: D(400), assigned_worker: 'Dana Demo', senior: true, reason_for_accessing: 'documentation_id', visit_count: 6, notes: 'File closed after ID documents were sorted; may return.' },
  ],
  RCClientNote: [
    { client_id: 'test_rc_amara', client_name: 'Amara Diallo', note: 'Prefers French for forms; bring translated documents to next appointment.', created_by_name: 'Terry Tester' },
    { client_id: 'test_rc_harold', client_name: 'Harold Thompson', note: 'SAFETY ALERT: Do not discuss finances in the lobby — requested privacy for money matters.', is_safety_alert: true, safety_alert_explanation: 'Client asked that personal financial matters be discussed privately only.', created_by_name: 'Dana Demo' },
    { client_id: 'test_rc_fatima', client_name: 'Fatima Said', note: 'Housing intake with social services booked; interpreter arranged for follow-up.', created_by_name: 'Terry Tester' },
  ],
  RCClientVisit: [
    { client_id: 'test_rc_harold', client_name: 'Harold Thompson', visit_date: D(3), visit_type: 'grab_and_go', resource_type: 'emergency_food', resource_quantity: 1, duration_minutes: 10, status: 'complete', caseworker_name: 'Dana Demo', visit_notes: 'Weekly hamper pickup; friendly chat.' },
    { client_id: 'test_rc_amara', client_name: 'Amara Diallo', visit_date: D(-2), visit_type: 'scheduled', status: 'pending', caseworker_name: 'Terry Tester', follow_up_required: 'yes', comments: 'Settlement follow-up appointment booked.' },
    { client_id: 'test_rc_wesley', client_name: 'Wesley Okafor', visit_date: D(8), visit_type: 'drop_in_casework', resource_type: 'access_computer_phone', resource_quantity: 1, duration_minutes: 45, status: 'complete', caseworker_name: 'Terry Tester', visit_notes: 'Used computer to apply for three jobs; resume printed.' },
  ],
  RCServiceLog: [
    { client_id: 'test_rc_amara', client_name: 'Amara Diallo', service_date: D(6), service_type: 'navigation', reason_for_visit: 'settlement_immigration', service_category: 'intensive_services', funder_category: 'other', worker_name: 'Terry Tester', description: 'Supported with SIN application and school registration for kids.', duration_minutes: 75, outcome: 'Applications submitted successfully', follow_up_needed: true, follow_up_date: D(-8) },
    { client_id: 'test_rc_fatima', client_name: 'Fatima Said', service_date: D(1), service_type: 'advocacy', reason_for_visit: 'housing_concerns', service_category: 'intensive_services', funder_category: 'other', worker_name: 'Terry Tester', description: 'Called landlord and connected client with housing navigator.', duration_minutes: 60, outcome: 'Housing navigator intake scheduled', follow_up_needed: true, follow_up_date: D(-1) },
    { client_id: 'test_rc_bella', client_name: 'Bella Cruz', service_date: D(10), service_type: 'caregiver_support', reason_for_visit: 'family_parenting_support', service_category: 'caregiver_capacity_0_5', funder_category: 'phac_caregiver_capacity', worker_name: 'Dana Demo', description: 'Discussed parenting group waitlist and home-visit options.', duration_minutes: 40, outcome: 'Added to PHAC caregiver program waitlist', follow_up_needed: false },
  ],
  RCAppointment: [
    { client_id: 'test_rc_amara', client_name: 'Amara Diallo', client_email: 'amara.diallo@example.ca', worker_name: 'Terry Tester', appointment_date: `${D(-2)}T10:00:00`, duration_minutes: 60, location_type: 'in_person', location_detail: 'Candora main floor', purpose: 'Settlement follow-up', status: 'scheduled' },
    { client_id: 'test_rc_wesley', client_name: 'Wesley Okafor', worker_name: 'Terry Tester', appointment_date: `${D(5)}T14:00:00`, duration_minutes: 45, location_type: 'phone', purpose: 'Job search check-in', status: 'completed' },
    { client_id: 'test_rc_harold', client_name: 'Harold Thompson', worker_name: 'Dana Demo', appointment_date: `${D(12)}T11:00:00`, duration_minutes: 30, location_type: 'in_person', purpose: 'Benefits review', status: 'no_show' },
  ],
  RCReferral: [
    { client_id: 'test_rc_wesley', client_name: 'Wesley Okafor', direction: 'outgoing', source_type: 'internal', organization: 'Pathways CM', contact_name: 'Terry Tester', contact_email: 'test.user@candora.ca', service_program: 'Pathways intake', reason: 'Employment-focused case management', status: 'accepted', referral_date: D(6), response_date: D(5) },
    { client_id: 'test_rc_fatima', client_name: 'Fatima Said', direction: 'incoming', source_type: 'external_partner', organization: 'Edmonton Housing Services', contact_name: 'Rae Navigator', contact_email: 'referrals@ehs.example.ca', contact_phone: '780-555-2201', service_program: 'Housing navigator', reason: 'Urgent housing concerns, family with three children', status: 'pending', referral_date: D(2) },
  ],
  RCClientNeed: [
    { client_id: 'test_rc_fatima', client_name: 'Fatima Said', category: 'housing', description: 'Family facing possible eviction; needs stable 2-bedroom housing', priority: 'high', status: 'in_progress', date_identified: D(2) },
    { client_id: 'test_rc_bella', client_name: 'Bella Cruz', category: 'childcare', description: 'Care for two children under 5 while attending programs', priority: 'medium', status: 'open', date_identified: D(18) },
    { client_id: 'test_rc_wesley', client_name: 'Wesley Okafor', category: 'employment_income', description: 'Needs part-time work while completing high school upgrading', priority: 'medium', status: 'addressed', date_identified: D(25), addressed_date: D(6) },
  ],
  IntensiveCase: [
    { client_id: 'test_rc_amara', client_name: 'Amara Diallo', assigned_worker: 'Terry Tester', service_start_date: D(85), complexity_level: 'high', case_status: 'active', next_contact_due: D(-3), next_review_due: D(-12), current_stage: 'Service plan', waitlist_priority: 'high' },
    { client_id: 'test_rc_fatima', client_name: 'Fatima Said', assigned_worker: 'Terry Tester', complexity_level: 'very_complex', case_status: 'waitlisted', waitlist_date: D(1), waitlist_priority: 'high', waitlist_notes: 'Prioritized for intensive supports due to housing crisis; intake in progress.' },
  ],

  // ── ELL ─────────────────────────────────────────────────────────────────
  ELLClass: [
    { id: 'test_ell_class_morning', name: 'Morning Class — CLB 4/5', clb_level: 'clb_4', description: 'Weekday morning class for intermediate learners.', instructor_id: 'test_ell_instr_iris', instructor_name: 'Iris Instructor', schedule_days: ['Monday', 'Wednesday', 'Friday'], start_time: '09:30', end_time: '11:30', location: 'Candora', room: 'large_classroom', capacity: 18, start_date: D(60), end_date: D(-60), status: 'active', color: '#f5c116' },
    { id: 'test_ell_class_evening', name: 'Evening Class — CLB 2/3', clb_level: 'clb_2', description: 'Evening class for beginner learners who work during the day.', instructor_id: 'test_ell_instr_nelly', instructor_name: 'Nelly Novice', schedule_days: ['Tuesday', 'Thursday'], start_time: '18:00', end_time: '20:00', location: 'Candora', room: 'small_classroom', capacity: 15, start_date: D(45), end_date: D(-45), status: 'active', color: '#0f1f6b' },
    { id: 'test_ell_class_convo', name: 'Conversation Circle — Mixed', clb_level: 'mixed', description: 'Drop-in conversation practice for all levels.', instructor_id: 'test_ell_instr_iris', instructor_name: 'Iris Instructor', schedule_days: ['Saturday'], start_time: '10:00', end_time: '12:00', location: 'Candora', room: 'arc', capacity: 20, start_date: D(30), status: 'active', color: '#2563eb' },
  ],
  ELLInstructor: [
    { id: 'test_ell_instr_iris', name: 'Iris Instructor', email: 'iris@example.ca', phone: '780-555-0403' },
    { id: 'test_ell_instr_nelly', name: 'Nelly Novice', email: 'nelly@example.ca', phone: '780-555-0404' },
  ],
  ELLLearner: [
    { id: 'test_ell_l1', first_name: 'Farida', last_name: 'Karim', phone: '780-555-2301', email: 'farida.karim@example.ca', country_of_origin: 'Egypt', first_language: 'Arabic', clb_level: 'clb_4', enrollment_status: 'active', intake_date: D(60), assigned_class_id: 'test_ell_class_morning', assigned_class_name: 'Morning Class — CLB 4/5', referral_source: 'Referred by a friend' },
    { id: 'test_ell_l2', first_name: 'Nguyen', last_name: 'Tran', phone: '780-555-2302', email: 'nguyen.tran@example.ca', country_of_origin: 'Vietnam', first_language: 'Vietnamese', clb_level: 'clb_2', enrollment_status: 'enrolled', intake_date: D(48), assigned_class_id: 'test_ell_class_evening', assigned_class_name: 'Evening Class — CLB 2/3', referral_source: 'Website' },
    { id: 'test_ell_l3', first_name: 'Rosa', last_name: 'Delgado', phone: '780-555-2303', country_of_origin: 'Mexico', first_language: 'Spanish', clb_level: 'clb_3', enrollment_status: 'waitlisted', waitlist_date: D(12), waitlist_status: 'contacted', last_contacted_date: D(4), last_contact_note: 'Left a message about an evening class opening.', interested_course_name: 'Evening Class — CLB 2/3' },
    { id: 'test_ell_l4', first_name: 'Amina', last_name: 'Yusuf', phone: '780-555-2304', email: 'amina.yusuf@example.ca', country_of_origin: 'Somalia', first_language: 'Somali', clb_level: 'clb_6', enrollment_status: 'active', intake_date: D(90), assigned_class_id: 'test_ell_class_morning', assigned_class_name: 'Morning Class — CLB 4/5' },
    { id: 'test_ell_l5', first_name: 'Chen', last_name: 'Wei', phone: '780-555-2305', country_of_origin: 'China', first_language: 'Mandarin', clb_level: 'not_assessed', enrollment_status: 'prospective', intake_date: D(3), interested_course_name: 'Conversation Circle — Mixed', referral_source: 'Poster in the mall' },
    { id: 'test_ell_l6', first_name: 'Katarzyna', last_name: 'Nowak', country_of_origin: 'Poland', first_language: 'Polish', clb_level: 'clb_5', enrollment_status: 'completed', intake_date: D(200), assigned_class_id: 'test_ell_class_morning', assigned_class_name: 'Morning Class — CLB 4/5' },
  ],
  ELLAssessment: [
    { learner_id: 'test_ell_l1', learner_name: 'Farida Karim', assessment_date: D(55), clb_level_before: 'clb_3', clb_level_after: 'clb_4', assessor_name: 'Iris Instructor', skill_areas: ['Speaking', 'Listening'], notes: 'Strong listening; speaking improving quickly.' },
    { learner_id: 'test_ell_l5', learner_name: 'Chen Wei', assessment_date: D(1), clb_level_before: 'not_assessed', clb_level_after: 'clb_3', assessor_name: 'Nelly Novice', skill_areas: ['Reading', 'Writing'], notes: 'Booked for evening class once a seat opens.' },
  ],

  // ── Central Registration ────────────────────────────────────────────────
  ProgramRegistration: [
    { participant_first_name: 'Rosa', participant_last_name: 'Delgado', participant_name: 'Rosa Delgado', participant_phone: '780-555-2303', program_portal: 'ell', program_name: 'Evening Class — CLB 2/3', registration_date: D(12), status: 'waitlisted', waitlist_position: 2, requires_approval: true, eligibility_assessed: true, eligibility_status: 'eligible' },
    { participant_first_name: 'Nguyen', participant_last_name: 'Tran', participant_name: 'Nguyen Tran', participant_phone: '780-555-2302', participant_email: 'nguyen.tran@example.ca', program_portal: 'ell', program_name: 'Evening Class — CLB 2/3', registration_date: D(48), status: 'enrolled', requires_approval: true, approval_date: D(47), approver_name: 'Dana Demo', eligibility_status: 'eligible' },
    { participant_first_name: 'Bella', participant_last_name: 'Cruz', participant_name: 'Bella Cruz', participant_phone: '780-555-2103', program_portal: 'rc', program_name: 'Caregiver Capacity (0-5)', registration_date: D(18), status: 'pending_approval', requires_approval: true, approver_name: 'Dana Demo', approver_email: 'test.admin@candora.ca', approval_request_sent: true, eligibility_status: 'not_assessed', notes: 'Two children under five; needs childcare during sessions.' },
    { participant_first_name: 'Fay', participant_last_name: 'Fake', participant_name: 'Fay Fake', participant_phone: '780-555-0601', program_portal: 'frn', program_name: 'FRN Demo Session', registration_date: D(10), status: 'approved', requires_approval: true, approval_date: D(9), approver_name: 'Dana Demo' },
    { participant_first_name: 'Dev', participant_last_name: 'Device', participant_name: 'Dev Device', participant_phone: '780-555-0801', program_portal: 'empoweru', program_name: 'EmpowerU Test Cohort', registration_date: D(20), status: 'enrolled', requires_approval: true, approval_date: D(19), approver_name: 'Dana Demo', time_slot: '9:00am-10:30am' },
  ],
  SelfRegProgram: [
    { area: 'ell', program_id: 'test_ell_class_evening', program_name: 'Evening Class — CLB 2/3', enabled: true, require_approval: true },
    { area: 'community', program_name: 'Sample Community Program', enabled: true, require_approval: false },
    { area: 'phac', program_name: 'Family Drop-In', enabled: false, require_approval: true },
    { area: 'frn', program_name: 'FRN Demo Session', enabled: true, require_approval: true },
  ],
  SelfRegRequest: [
    { area: 'ell', program_id: 'test_ell_class_evening', program_name: 'Evening Class — CLB 2/3', first_name: 'Chen', last_name: 'Wei', phone: '780-555-2305', email: 'chen.wei@example.ca', status: 'pending', notes: 'Scanned the QR code at the library.' },
    { area: 'community', program_name: 'Sample Community Program', first_name: 'Jamie', last_name: 'Joiner', phone: '780-555-0502', email: 'jamie@example.ca', status: 'approved', auto_approved: true, reviewed_by_name: 'Auto-approved', reviewed_date: D(4) },
    { area: 'phac', program_name: 'Family Drop-In', first_name: 'Kit', last_name: 'Kindling', parent_guardian_name: 'Guardian Kindling', parent_guardian_phone: '780-555-0702', parent_guardian_email: 'guardian@example.ca', status: 'rejected', reviewed_by_name: 'Dana Demo', reviewed_date: D(6), review_notes: 'Program currently full; invited to re-register next term.' },
  ],
  CentralRegAreaCapacity: [
    { area: 'ell', program_id: 'test_ell_class_morning', max_capacity: 18 },
    { area: 'ell', program_id: 'test_ell_class_evening', max_capacity: 15 },
    { area: 'frn', program_id: 'test_frn_session', max_capacity: 12 },
    { area: 'phac', program_id: 'test_phac_session', max_capacity: 10 },
    { area: 'community', program_id: 'test_community_session', max_capacity: 25 },
  ],
};