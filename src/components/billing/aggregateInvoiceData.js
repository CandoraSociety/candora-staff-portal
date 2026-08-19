// Helpers for building a multi-month (range) invoice by summing each month's
// invoice data across the range. Each month's data is either a live read from
// the CRT Invoice Tracker (getMonthlyInvoiceData response) or the frozen
// snapshot stored on a finalized Invoice record.

export const FIXED_MONTHLY_FEE = 31755;

// All "YYYY-MM" months in an inclusive range, chronological order.
export function monthsInRange(start, end) {
  const out = [];
  let [y, m] = String(start || '').split('-').map(Number);
  const [ey, em] = String(end || '').split('-').map(Number);
  if (!y || !ey) return out;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

// Convert a finalized Invoice record's snapshot into the same shape as a
// getMonthlyInvoiceData success response so the aggregator can consume both.
export function snapshotToData(inv) {
  return {
    status: 'success',
    billingMonth: inv?.billing_month,
    invoiceNumber: inv?.invoice_number != null ? Number(inv.invoice_number) : null,
    header: inv?.header_info || [],
    lineItems: inv?.line_items || [],
  };
}

const DELIVERABLE_ORDER = [
  'deaStarters',
  'wdComplete',
  'wdPlacementCompletion',
  'dea90Day',
  'wd90Day',
  'serviceNavFee',
];
const DIRECT_ORDER = [
  'employmentSupports',
  'exposureCourseDea',
  'exposureCourseWd',
  'paidWorkExposure',
];
const OTHER_ORDER = ['childminding'];

// Sum an array of per-month data objects into one combined invoice payload.
// The Fixed Monthly Fee line carries quantity = number of months and amount =
// fee × months; every other line item's quantity and amount are added across
// months (deliverable unit prices are recomputed from the summed totals).
export function aggregateMonthData(monthsData) {
  const byKey = {};
  let fixedQty = 0;
  let fixedAmount = 0;
  let invoiceNumber = null;
  let header = [];
  const labels = {};

  const collect = (data) => {
    if (!data || data.status !== 'success') return;
    if (header.length === 0 && Array.isArray(data.header) && data.header.length) header = data.header;
    const items = data.lineItems || [];
    for (const it of items) {
      if (!it || !it.key) continue;
      if (!labels[it.key] && it.label) labels[it.key] = it.label;
      if (it.key === 'fixedMonthlyFee') {
        fixedQty += 1;
        fixedAmount += Number(it.amount) || 0;
      } else if (it.section === 'deliverable') {
        if (!byKey[it.key]) byKey[it.key] = { key: it.key, label: it.label, section: 'deliverable', quantity: 0, amount: 0 };
        byKey[it.key].quantity += Number(it.quantity) || 0;
        byKey[it.key].amount += Number(it.amount) || 0;
      } else {
        // direct_cost or other_services — dollar-only
        if (!byKey[it.key]) byKey[it.key] = { key: it.key, label: it.label, section: it.section, quantity: null, unitPrice: null, amount: 0 };
        byKey[it.key].amount += Number(it.amount) || 0;
      }
    }
    if (data.invoiceNumber != null && invoiceNumber == null) invoiceNumber = data.invoiceNumber;
  };

  (monthsData || []).forEach(collect);

  for (const k of Object.keys(byKey)) {
    const it = byKey[k];
    if (it.section === 'deliverable' && it.quantity > 0) {
      it.unitPrice = Math.round((it.amount / it.quantity) * 100) / 100;
    }
  }

  let subtotalDeliverables = 0;
  let subtotalDirectCosts = 0;
  let subtotalOtherServices = 0;

  const lineItems = [
    {
      key: 'fixedMonthlyFee',
      label: 'Fixed Monthly Fee',
      section: 'fixed',
      quantity: fixedQty,
      unitPrice: fixedQty > 0 ? FIXED_MONTHLY_FEE : null,
      amount: fixedAmount,
    },
  ];
  for (const k of DELIVERABLE_ORDER) {
    if (byKey[k]) {
      lineItems.push(byKey[k]);
      subtotalDeliverables += byKey[k].amount;
    }
  }
  for (const k of DIRECT_ORDER) {
    if (byKey[k]) {
      lineItems.push(byKey[k]);
      subtotalDirectCosts += byKey[k].amount;
    }
  }
  for (const k of OTHER_ORDER) {
    if (byKey[k]) {
      lineItems.push(byKey[k]);
      subtotalOtherServices += byKey[k].amount;
    }
  }

  return {
    status: 'success',
    invoiceNumber,
    header,
    lineItems,
    subtotalDeliverables: Math.round(subtotalDeliverables * 100) / 100,
    subtotalDirectCosts: Math.round(subtotalDirectCosts * 100) / 100,
    subtotalOtherServices: Math.round(subtotalOtherServices * 100) / 100,
    subtotalFixed: fixedAmount,
    total: Math.round((fixedAmount + subtotalDeliverables + subtotalDirectCosts + subtotalOtherServices) * 100) / 100,
  };
}