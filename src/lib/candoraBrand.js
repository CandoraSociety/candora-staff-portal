// Candora branding + contact details used on generated invoices and other
// client-facing documents. Update these values to refine the footer.
export const CANDORA_BRAND = {
  name: 'CANDORA',
  legalName: 'Candora Society',
  logoUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/ba25bbc7f_SquareLogo_Sunflower.png',
  longLogoUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/5625645f1_LongFormLogo.png',
  address: '#262, 3210 118 Avenue NW',
  city: 'Edmonton',
  province: 'Alberta',
  postalCode: 'T5W 4W1',
  phone: '780.474.5011',
  email: 'info@candorasociety.com',
  website: 'candora.ca',
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