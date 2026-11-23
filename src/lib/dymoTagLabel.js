// A Kids Gift Shop name tag as a DYMO label file, so the label printer can be
// driven directly at its own 2.3 x 4 in label size — no browser print dialog.
// Coordinates are twips (1440 per inch) on a landscape 30256 Shipping label.
import {
  giftShopAgeBandLabel,
  giftShopChildFirstName,
  giftShopFamilyChildNames,
  giftShopGuardianName,
  giftShopSlotLabel,
  giftShopTagGifts,
} from '@/lib/giftShopFamilies';

const escapeXml = (value) => String(value ?? '').replace(/[<>&"']/g, c => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]
));

const textObject = ({ name, x, y, width, height, size, bold = false, align = 'Left', text }) => `
  <ObjectInfo>
    <TextObject>
      <Name>${name}</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>${align}</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>AlwaysFit</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>${escapeXml(text)}</String>
          <Attributes>
            <Font Family="Helvetica" Size="${size}" Bold="${bold ? 'True' : 'False'}" Italic="False" Underline="False" Strikeout="False"/>
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <Bounds X="${x}" Y="${y}" Width="${width}" Height="${height}"/>
  </ObjectInfo>`;

const imageObject = ({ name, x, y, width, height, png, opaque = true }) => `
  <ObjectInfo>
    <ImageObject>
      <Name>${name}</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="${opaque ? 255 : 0}" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <Image>${escapeXml(png)}</Image>
      <ScaleMode>Uniform</ScaleMode>
      <BorderWidth>0</BorderWidth>
      <BorderColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Center</VerticalAlignment>
    </ImageObject>
    <Bounds X="${x}" Y="${y}" Width="${width}" Height="${height}"/>
  </ObjectInfo>`;

const qrObject = (qrPng) => imageObject({ name: 'QRCODE', x: 4060, y: 110, width: 1600, height: 1600, png: qrPng });

// The Candora mark under the QR code and the Kids Gift Shop initials in the
// footer, printed large enough to read at a glance on the 2.3 x 4 in label.
const brandObjects = (logoPng) => [
  logoPng ? imageObject({ name: 'LOGO', x: 4060, y: 1790, width: 1600, height: 750, png: logoPng, opaque: false }) : '',
  textObject({ name: 'KGS', x: 1030, y: 2470, width: 2900, height: 780, size: 15, bold: true, align: 'Center', text: 'KGS' }),
];

const wrapLabel = (objects) => `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>LargeShipping</Id>
  <PaperName>30256 Shipping</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="3331" Height="5715" Rx="270" Ry="270"/>
  </DrawCommands>${objects.filter(Boolean).join('')}
</DieCutLabel>`;

export default function buildTagLabelXml(tag, { qrPng, logoPng } = {}) {
  const slot = [giftShopSlotLabel(tag.time_slot), giftShopAgeBandLabel(tag.child_age_band)]
    .filter(Boolean).join(' · ');
  const guardian = giftShopGuardianName(tag);

  const objects = [
    textObject({ name: 'NUMBER', x: 120, y: 180, width: 900, height: 2950, size: 90, bold: true, text: tag.check_in_sequence ?? '' }),
    textObject({ name: 'CHILD', x: 1030, y: 170, width: 2900, height: 760, size: 44, bold: true, text: giftShopChildFirstName(tag) }),
    textObject({ name: 'SLOT', x: 1030, y: 990, width: 2900, height: 400, size: 22, bold: true, text: slot }),
    guardian ? textObject({ name: 'GUARDIAN', x: 1030, y: 1450, width: 2900, height: 380, size: 17, text: `Parent/Guardian: ${guardian}` }) : '',
    textObject({ name: 'GIFTS', x: 1030, y: 1870, width: 2900, height: 480, size: 22, bold: true, text: giftShopTagGifts(tag) }),
    qrPng ? qrObject(qrPng) : '',
    ...brandObjects(logoPng),
  ];

  return wrapLabel(objects);
}

// The check-in desk's own QR label — the same code shown in the Check-in QR
// window, printed at the label size so a fresh sticker can go over an old one
// whenever the desk code changes.
export function buildCheckinQrLabelXml({ qrPng, logoPng } = {}) {
  const objects = [
    textObject({
      name: 'TITLE',
      x: 150,
      y: 100,
      width: 5415,
      height: 620,
      size: 32,
      bold: true,
      align: 'Center',
      text: 'Scan to Check-In to Kids Gift Shop',
    }),
    qrPng ? imageObject({ name: 'QRCODE', x: 1907, y: 780, width: 1900, height: 1900, png: qrPng }) : '',
    logoPng ? imageObject({ name: 'LOGO', x: 1902, y: 2720, width: 800, height: 460, png: logoPng, opaque: false }) : '',
    textObject({ name: 'KGS', x: 2762, y: 2740, width: 1050, height: 420, size: 26, bold: true, text: 'KGS' }),
  ];

  return wrapLabel(objects);
}

// The parent or guardian's own tag: their name, the shopping slot, and every
// child they are at the shop with. No QR code — it is for the volunteer to read.
export function buildGuardianLabelXml(family, { logoPng } = {}) {
  const children = giftShopFamilyChildNames(family);

  const objects = [
    textObject({ name: 'BADGE', x: 140, y: 200, width: 3900, height: 460, size: 20, bold: true, text: 'Parent/Guardian' }),
    textObject({ name: 'GUARDIAN_NAME', x: 140, y: 760, width: 3900, height: 960, size: 44, bold: true, text: family.guardian_name || 'Parent / Guardian' }),
    textObject({ name: 'SLOT', x: 140, y: 1820, width: 3900, height: 380, size: 20, bold: true, text: giftShopSlotLabel(family.time_slot) }),
    children.length
      ? textObject({
        name: 'KIDS',
        x: 140,
        y: 2260,
        width: 3900,
        height: 860,
        size: 22,
        bold: true,
        text: children.map(name => `Shopper's name: ${name}`).join('\n'),
      })
      : '',
    logoPng ? imageObject({ name: 'LOGO', x: 4400, y: 200, width: 1100, height: 750, png: logoPng, opaque: false }) : '',
    textObject({ name: 'KGS', x: 4400, y: 1020, width: 1100, height: 500, size: 30, bold: true, align: 'Center', text: 'KGS' }),
  ];

  return wrapLabel(objects);
}