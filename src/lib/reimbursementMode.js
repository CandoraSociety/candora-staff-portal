// Shared config for the two staff purchase flows:
// 'reimbursement' — out-of-pocket Reimbursement Requests (existing flow, unchanged)
// 'cc'            — Candora MasterCard (CC) receipts, submitted to the Candora MasterCard tab in Finance
export const REIMBURSEMENT_MODES = {
  reimbursement: {
    entryEntity: 'ReimbursementEntry',
    formEntity: 'StaffReimbursementRequest',
    myEntriesKey: 'my-reimbursement-entries',
    myFormsKey: 'my-reimbursement-forms',
    financeFormsKey: 'staff-reimbursements',
    financeEntriesKey: 'staff-reimbursement-entries',
    submitButton: 'Submit for Reimbursement',
    submitTitle: 'Submit for Reimbursement',
    downloadButton: 'Download Reimbursement',
    docTitle: 'Staff Reimbursement Request',
    formCardLabel: 'Reimbursement Form',
    financeTitle: 'Staff Reimbursement Requests',
    financeSubtitle: "Reimbursement forms submitted by staff. Each form compiles that staff member's individual receipt entries — verify, then mark paid to reimburse.",
    financeEmpty: 'No reimbursement forms yet. Forms appear here when staff click “Submit for Reimbursement”.',
  },
  cc: {
    entryEntity: 'CCReceiptEntry',
    formEntity: 'CCReceiptSubmission',
    myEntriesKey: 'my-cc-receipt-entries',
    myFormsKey: 'my-cc-receipt-forms',
    financeFormsKey: 'cc-receipt-submissions',
    financeEntriesKey: 'cc-receipt-entries',
    submitButton: 'Submit Receipts',
    submitTitle: 'Submit MasterCard Receipts',
    downloadButton: 'Download Receipts',
    docTitle: 'Candora MasterCard Receipts',
    formCardLabel: 'MasterCard Receipts',
    financeTitle: 'Candora MasterCard',
    financeSubtitle: "Candora MasterCard receipt submissions from staff. Each submission compiles that staff member's individual receipts — verify, then mark paid.",
    financeEmpty: 'No MasterCard receipt submissions yet. Submissions appear here when staff click “Submit Receipts” on the Candora CC Receipts page.',
  },
};