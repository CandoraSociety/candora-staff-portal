// Shared naming convention for Pathways payables supporting documents.
// Pattern: <Type>_<Descriptor>_<Client>_<Month>.<ext>

export function sanitizeDocPart(part) {
  return String(part || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// recordType: 'exposure_course' | 'employment_supports' | 'paid_external_placement'
// descriptor: course name / support type / company name (depending on type)
// month: billing month string (yyyy-MM)
export function buildBillingDocName({ recordType, descriptor, clientName, month, originalName }) {
  let prefix;
  if (recordType === 'exposure_course') prefix = 'Exposure_Course';
  else if (recordType === 'employment_supports') prefix = 'Employment_Support';
  else if (recordType === 'paid_external_placement') prefix = 'Work_Exposure_Payment';
  else return originalName;

  const ext = originalName && originalName.includes('.')
    ? originalName.split('.').pop()
    : '';
  const parts = [prefix, sanitizeDocPart(descriptor), sanitizeDocPart(clientName), month || ''].filter(Boolean);
  let name = parts.join('_');
  if (ext) name += '.' + ext;
  return name;
}

// Descriptor resolved from a FinancialRecord (used in the Supporting Documents tab)
export function descriptorFromFinancialRecord(record) {
  const type = record?.record_type;
  if (type === 'exposure_course') return record.course_type_other || record.course_type;
  if (type === 'employment_supports') return record.support_type;
  if (type === 'paid_external_placement') return record.vendor;
  return '';
}