// The CANDORA contact card. Twilio fetches this file and attaches it to the
// first text a Kids Gift Shop family receives, so they can save the number as
// CANDORA instead of seeing an unknown 587 number. Canadian numbers cannot
// carry a sender name, so this is how the brand reaches the family's phone.
const CARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:;CANDORA;;;',
  'FN:CANDORA',
  'ORG:Candora',
  'TEL;TYPE=CELL:+15877142554',
  'END:VCARD',
].join('\r\n');

export default async function (req) {
  return new Response(CARD, {
    status: 200,
    headers: {
      'Content-Type': 'text/x-vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="CANDORA.vcf"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}