// Composes the final signed image: the user's signature with a small
// verification ID + UTC timestamp printed tightly underneath.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function composeSignedImage(profile, log) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 10; // placeholder — real height computed below
  let ctx = canvas.getContext('2d');

  const VERIF_FONT = '10.5px Inter, sans-serif';
  const VERIF_GAP = 5; // gap between signature ink and verification text

  const setTypedFont = (c) => {
    const family = profile.font_family || "'Great Vibes', cursive";
    c.font = `${profile.italic ? 'italic ' : ''}${profile.bold ? '700 ' : ''}64px ${family}`;
    c.fillStyle = profile.font_color || '#0f172a';
    try { c.letterSpacing = `${profile.letter_spacing || 0}px`; } catch {}
  };

  // ---- Pass 1: measure content to compute layout ----
  let contentBottom = 0;
  let layout = null;

  if (profile?.signature_type === 'typed' && profile.typed_text) {
    const family = profile.font_family || "'Great Vibes', cursive";
    const firstFamily = family.split(',')[0].replace(/['"]/g, '').trim();
    try { await document.fonts.load(`64px "${firstFamily}"`); } catch {}
    setTypedFont(ctx);
    const m = ctx.measureText(profile.typed_text);
    const ascent = m.actualBoundingBoxAscent || 44;
    const descent = m.actualBoundingBoxDescent || 16;
    layout = { kind: 'typed', ascent, descent, width: m.width };
    contentBottom = 8 + ascent + descent + (profile.underline ? 8 : 0);
  } else if (profile?.signature_url) {
    const img = await loadImage(profile.signature_url);
    const scale = Math.min(560 / img.width, 180 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    layout = { kind: 'image', img, w, h };
    contentBottom = 8 + h;
  } else {
    ctx.font = 'italic 44px "Playfair Display", serif';
    const m = ctx.measureText(profile?.user_name || 'Signature');
    layout = { kind: 'fallback', ascent: m.actualBoundingBoxAscent || 30, descent: m.actualBoundingBoxDescent || 10 };
    contentBottom = 8 + layout.ascent + layout.descent;
  }

  // Verification text: two tight lines right under the signature
  const verifY1 = contentBottom + VERIF_GAP + 10;
  const verifY2 = verifY1 + 13;
  const canvasHeight = Math.ceil(verifY2 + 5);
  canvas.height = canvasHeight; // resets context state
  ctx = canvas.getContext('2d');

  // ---- Pass 2: draw ----
  if (layout.kind === 'typed') {
    setTypedFont(ctx);
    if (profile.glow) {
      ctx.shadowColor = profile.font_color || '#0f172a';
      ctx.shadowBlur = 14;
    } else if (profile.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.28)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 3;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const baseline = 8 + layout.ascent;
    if (profile.outline) {
      ctx.strokeStyle = profile.font_color || '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeText(profile.typed_text, 320, baseline);
    } else {
      ctx.fillText(profile.typed_text, 320, baseline);
    }
    if (profile.underline) {
      ctx.beginPath();
      ctx.moveTo(320 - layout.width / 2, baseline + layout.descent + 4);
      ctx.lineTo(320 + layout.width / 2, baseline + layout.descent + 4);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch {}
  } else if (layout.kind === 'image') {
    ctx.drawImage(layout.img, (640 - layout.w) / 2, 8, layout.w, layout.h);
  } else {
    ctx.font = 'italic 44px "Playfair Display", serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(profile?.user_name || 'Signature', 320, 8 + layout.ascent);
  }

  // Verification info — small but readable, snug against the signature
  ctx.font = VERIF_FONT;
  ctx.fillStyle = 'rgba(60, 65, 80, 0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`ID: ${log.generated_id}`, 320, verifY1);
  ctx.fillText(`${log.timestamp_utc}  •  ${log.verification_status}`, 320, verifY2);

  return canvas.toDataURL('image/png');
}