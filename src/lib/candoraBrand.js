// Candora branding + contact details used on generated invoices and other
// client-facing documents. Update these values to refine the footer.
export const CANDORA_BRAND = {
  name: 'Candora Society',
  legalName: 'Candora Society',
  tagline: 'Employment & Community Development',
  address: '#262, 3210 118 Avenue NW',
  city: 'Edmonton',
  province: 'Alberta',
  postalCode: 'T5W 4W1',
  phone: '780.474.5011',
  email: 'graham.currie@candorasociety.com',
  website: 'candorasociety.com',
};

export function brandFooterLines() {
  const { address, city, province, postalCode, phone, email, website } = CANDORA_BRAND;
  const cityLine = [city, province, postalCode].filter(Boolean).join(' ');
  const lines = [];
  if (address || cityLine) lines.push([address, cityLine].filter(Boolean).join(', '));
  if (phone) lines.push(`Phone: ${phone}`);
  if (email) lines.push(`Email: ${email}`);
  if (website) lines.push(`Website: ${website}`);
  return lines;
}