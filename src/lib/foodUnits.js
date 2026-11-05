import { Coffee, Store, ChefHat, Soup } from 'lucide-react';

// The four food operations. `orderType` matches FoodOrder.order_type so the
// counter-order figures and the POS report figures line up on the same unit.
export const FOOD_UNITS = [
  { value: 'cafe_candeur', label: 'Café Candeur', shortLabel: 'Café', icon: Coffee, orderType: 'dine_in' },
  { value: 'auntie_bevs', label: "Auntie Bev's", shortLabel: 'Auntie Bev', icon: Store, orderType: 'takeout' },
  { value: 'catering', label: 'Catering', shortLabel: 'Catering', icon: ChefHat, orderType: 'catering' },
  { value: 'community_lunch', label: 'Community Lunch', shortLabel: 'Community', icon: Soup, orderType: 'community' },
];

export const unitByValue = (value) => FOOD_UNITS.find(u => u.value === value) || FOOD_UNITS[0];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const money = (value) => `$${(Number(value) || 0).toLocaleString('en-CA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

// Date-only strings are formatted from their own parts, never through a Date,
// so a report can never show the day before.
export const formatReportDate = (value) => {
  const [year, month, day] = String(value || '').slice(0, 10).split('-');
  if (!month || !day) return '—';
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
};

export const reportPeriod = (report) => {
  const start = String(report?.period_start || '').slice(0, 10);
  const end = String(report?.period_end || '').slice(0, 10);
  if (start && end && start !== end) return `${formatReportDate(start)} – ${formatReportDate(end)}`;
  return formatReportDate(end || start);
};

// Revenue the portal records for a report: net sales, worked out from the
// components when the stored field is missing.
export const reportNet = (report) => {
  if (report?.net_sales !== undefined && report?.net_sales !== null) return Number(report.net_sales) || 0;
  return (Number(report?.gross_sales) || 0) - (Number(report?.discounts) || 0) - (Number(report?.refunds) || 0);
};

// YYYY-MM of a report — the month its revenue is filed under.
export const reportMonth = (report) =>
  String(report?.period_end || report?.period_start || '').slice(0, 7);

export const sumReports = (reports = []) => reports.reduce((acc, r) => {
  acc.net += reportNet(r);
  acc.gross += Number(r.gross_sales) || 0;
  acc.tax += Number(r.tax) || 0;
  acc.transactions += Number(r.transaction_count) || 0;
  return acc;
}, { net: 0, gross: 0, tax: 0, transactions: 0 });