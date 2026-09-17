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
  const W = 900;
  canvas.width = W;
  canvas.height = 10; // placeholder — real height computed below
  let ctx = canvas.getContext('2d');

  const VERIF_FONT = '20px Inter, sans-serif';
  const VERIF_GAP = 10; // gap between signature ink and verification text

  const setTypedFont = (c) => {
    const family = profile.font_family || "'Great Vibes', cursive";
    c.font = `${profile.italic ? 'italic ' : ''}${profile.bold ? '700 ' : ''}110px ${family}`;
    c.fillStyle = profile.font_color || '#0f172a';
    try { c.letterSpacing = `${profile.letter_spacing || 0}px`; } catch {}
  };

  // ---- Pass 1: measure content to compute layout ----
  let contentBottom = 0;
  let layout = null;

  if (profile?.signature_type === 'typed' && profile.typed_text) {
    const family = profile.font_family || "'Great Vibes', cursive";
    const firstFamily = family.split(',')[0].replace(/['"]/g, '').trim();
    try { await document.fonts.load(`110px "${firstFamily}"`); } catch {}
    setTypedFont(ctx);
    const m = ctx.measureText(profile.typed_text);
    const ascent = m.actualBoundingBoxAscent || 76;
    const descent = m.actualBoundingBoxDescent || 28;
    layout = { kind: 'typed', ascent, descent, width: m.width };
    contentBottom = 12 + ascent + descent + (profile.underline ? 10 : 0);
  } else if (profile?.signature_url) {
    const img = await loadImage(profile.signature_url);
    const scale = Math.min(760 / img.width, 320 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    layout = { kind: 'image', img, w, h };
    contentBottom = 12 + h;
  } else {
    ctx.font = 'italic 72px "Playfair Display", serif';
    const m = ctx.measureText(profile?.user_name || 'Signature');
    layout = { kind: 'fallback', ascent: m.actualBoundingBoxAscent || 50, descent: m.actualBoundingBoxDescent || 16 };
    contentBottom = 12 + layout.ascent + layout.descent;
  }

  // Verification text: two tight lines right under the signature
  const verifY1 = contentBottom + VERIF_GAP + 18;
  const verifY2 = verifY1 + 26;
  const canvasHeight = Math.ceil(verifY2 + 8);
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
    const baseline = 12 + layout.ascent;
    if (profile.outline) {
      ctx.strokeStyle = profile.font_color || '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeText(profile.typed_text, W / 2, baseline);
    } else {
      ctx.fillText(profile.typed_text, W / 2, baseline);
    }
    if (profile.underline) {
      ctx.beginPath();
      ctx.moveTo(W / 2 - layout.width / 2, baseline + layout.descent + 6);
      ctx.lineTo(W / 2 + layout.width / 2, baseline + layout.descent + 6);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch {}
  } else if (layout.kind === 'image') {
    ctx.drawImage(layout.img, (W - layout.w) / 2, 12, layout.w, layout.h);
  } else {
    ctx.font = 'italic 72px "Playfair Display", serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(profile?.user_name || 'Signature', W / 2, 12 + layout.ascent);
  }

  // Verification info — small but readable, snug against the signature
  ctx.font = VERIF_FONT;
  ctx.fillStyle = 'rgba(60, 65, 80, 0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`ID: ${log.generated_id}`, W / 2, verifY1);
  ctx.fillText(`${log.timestamp_utc}  •  ${log.verification_status}`, W / 2, verifY2);

  return canvas.toDataURL('image/png');
}