// Composes the final signed image: the user's signature with a small
// verification ID + UTC timestamp printed underneath.

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
  canvas.height = 240;
  const ctx = canvas.getContext('2d');

  if (profile?.signature_type === 'typed' && profile.typed_text) {
    const family = profile.font_family || "'Great Vibes', cursive";
    const firstFamily = family.split(',')[0].replace(/['"]/g, '').trim();
    try { await document.fonts.load(`64px "${firstFamily}"`); } catch {}
    ctx.font = `${profile.italic ? 'italic ' : ''}${profile.bold ? '700 ' : ''}64px ${family}`;
    ctx.fillStyle = profile.font_color || '#0f172a';
    try { ctx.letterSpacing = `${profile.letter_spacing || 0}px`; } catch {}

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
    ctx.textBaseline = 'middle';

    if (profile.outline) {
      ctx.strokeStyle = profile.font_color || '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeText(profile.typed_text, 320, 95);
    } else {
      ctx.fillText(profile.typed_text, 320, 95);
    }

    if (profile.underline) {
      const m = ctx.measureText(profile.typed_text);
      const uy = 95 + (m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || 18) + 6;
      ctx.beginPath();
      ctx.moveTo(320 - m.width / 2, uy);
      ctx.lineTo(320 + m.width / 2, uy);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch {}
  } else if (profile?.signature_url) {
    const img = await loadImage(profile.signature_url);
    const maxW = 560;
    const maxH = 180;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (640 - w) / 2, 95 - h / 2, w, h);
  } else {
    ctx.font = 'italic 44px "Playfair Display", serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(profile?.user_name || 'Signature', 320, 95);
  }

  // Verification info — small but readable
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = 'rgba(60, 65, 80, 0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`ID: ${log.generated_id}`, 320, 200);
  ctx.fillText(`${log.timestamp_utc}  •  ${log.verification_status}`, 320, 216);

  return canvas.toDataURL('image/png');
}