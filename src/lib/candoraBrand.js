// Candora branding + contact details used on generated invoices and other
// client-facing documents. Update these values to refine the footer.
export const CANDORA_BRAND = {
  name: 'Candora Society',
  legalName: 'Candora Society',
  tagline: 'Employment & Community Development',
  // Contact details — confirm/refine the real address & phone:
  address: '', // e.g. "123 Example Street"
  city: 'Edmonton',
  province: 'AB',
  postalCode: '',
  phone: '',
  email: 'graham.currie@candorasociety.com',
  website: 'candorasociety.com',
  charitableNumber: '',
};

export function brandFooterLines() {
  const lines = [];
  const { address, city, province, postalCode, phone, email, website } = CANDORA_BRAND;
  const cityLine = [city, province, postalCode].filter(Boolean).join(', ');
  if (address || cityLine) lines.push([address, cityLine].filter(Boolean).join(' — '));
  if (phone) lines.push(`Phone: ${phone}`);
  if (email) lines.push(`Email: ${email}`);
  if (website) lines.push(`Website: ${website}`);
  return lines;
}