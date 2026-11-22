// A Kids Gift Shop name tag as a DYMO label file, so the label printer can be
// driven directly at its own 2.3 x 4 in label size — no browser print dialog.
// Coordinates are twips (1440 per inch) on a landscape 30256 Shipping label.
import {
  giftShopAgeBandLabel,
  giftShopChildFirstName,
  giftShopGuardianName,
  giftShopSlotLabel,
  giftShopTagGifts,
} from '@/lib/giftShopFamilies';

const escapeXml = (value) => String(value ?? '').replace(/[<>&"']/g, c => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]
));

const textObject = ({ name, x, y, width, height, size, bold = false, text }) => `
  <ObjectInfo>
    <TextObject>
      <Name>${name}</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>Left</HorizontalAlignment>
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

const qrObject = (qrPng) => `
  <ObjectInfo>
    <ImageObject>
      <Name>QRCODE</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="255" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <Image>${escapeXml(qrPng)}</Image>
      <ScaleMode>Uniform</ScaleMode>
      <BorderWidth>0</BorderWidth>
      <BorderColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Center</VerticalAlignment>
    </ImageObject>
    <Bounds X="4480" Y="180" Width="1080" Height="1080"/>
  </ObjectInfo>`;

export default function buildTagLabelXml(tag, { qrPng } = {}) {
  const slot = [giftShopSlotLabel(tag.time_slot), giftShopAgeBandLabel(tag.child_age_band)]
    .filter(Boolean).join(' · ');
  const guardian = giftShopGuardianName(tag);

  const objects = [
    textObject({ name: 'NUMBER', x: 120, y: 180, width: 900, height: 2950, size: 90, bold: true, text: tag.check_in_sequence ?? '' }),
    textObject({ name: 'CHILD', x: 1140, y: 200, width: 3250, height: 760, size: 42, bold: true, text: giftShopChildFirstName(tag) }),
    textObject({ name: 'SLOT', x: 1140, y: 1000, width: 3250, height: 420, size: 20, bold: true, text: slot }),
    guardian ? textObject({ name: 'GUARDIAN', x: 1140, y: 1460, width: 3250, height: 380, size: 16, text: `Parent/Guardian: ${guardian}` }) : '',
    textObject({ name: 'GIFTS', x: 1140, y: 1900, width: 3250, height: 440, size: 20, bold: true, text: giftShopTagGifts(tag) }),
    qrPng ? qrObject(qrPng) : '',
  ];

  return `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>LargeShipping</Id>
  <PaperName>30256 Shipping</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="3331" Height="5715" Rx="270" Ry="270"/>
  </DrawCommands>${objects.filter(Boolean).join('')}
</DieCutLabel>`;
}