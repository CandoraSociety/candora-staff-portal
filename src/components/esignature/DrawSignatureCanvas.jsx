import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eraser, Undo2, Sparkles } from 'lucide-react';

const PEN_COLORS = [
  '#0f172a', '#334155', '#1d4ed8', '#0e7490', '#047857',
  '#4d7c0f', '#c2410c', '#b91c1c', '#be185d', '#7c3aed',
];

const PEN_STYLES = [
  { value: 'ballpoint', label: 'Ballpoint pen' },
  { value: 'fountain', label: 'Fountain pen' },
  { value: 'quill', label: 'Quill' },
  { value: 'marker', label: 'Marker' },
  { value: 'brush', label: 'Brush' },
];

// AI stroke smoothing — moving-average filter that removes hand jitter
// so shaky cursor drawing still looks natural.
function smoothPoints(points) {
  if (points.length < 5) return points;
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const from = Math.max(0, i - 2);
    const to = Math.min(points.length - 1, i + 2);
    let sx = 0, sy = 0, st = 0;
    for (let j = from; j <= to; j++) {
      sx += points[j].x;
      sy += points[j].y;
      st += points[j].t;
    }
    const n = to - from + 1;
    out.push({ x: sx / n, y: sy / n, t: st / n });
  }
  return out;
}

function pathStroke(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function drawStroke(ctx, stroke, color, shadow) {
  const raw = stroke.points;
  if (!raw.length) return;
  const pts = stroke.smoothed ? smoothPoints(raw) : raw;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const base = stroke.width;

  if (stroke.style === 'ballpoint') {
    ctx.lineWidth = base;
    pathStroke(ctx, pts);
  } else if (stroke.style === 'marker') {
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = base * 2.2;
    pathStroke(ctx, pts);
  } else {
    // Variable-width styles: slower strokes draw thicker, like a real nib.
    // Width always comes from the RAW points (your original pen speed), so
    // smoothing out a shaky line never flattens the nib character of the style.
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const ra = raw[i - 1];
      const rb = raw[i];
      const dt = Math.max((rb.t - ra.t) || 8, 4);
      const v = Math.hypot(rb.x - ra.x, rb.y - ra.y) / dt; // px per ms
      let f = 1;
      let alpha = 1;
      if (stroke.style === 'quill') {
        f = Math.min(Math.max(2.0 - v * 1.1, 0.35), 2.1);
        alpha = 0.9;
      } else if (stroke.style === 'fountain') {
        f = Math.min(Math.max(1.5 - v * 0.6, 0.55), 1.5);
      } else {
        f = Math.min(Math.max(1.7 - v * 0.9, 0.5), 1.7);
        alpha = 0.85;
      }
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(base * f, 0.6);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export default function DrawSignatureCanvas({ onChange }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const currentRef = useRef(null);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [style, setStyle] = useState('ballpoint');
  const [shadow, setShadow] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach((s) => drawStroke(ctx, s, color, shadow));
    if (currentRef.current) drawStroke(ctx, currentRef.current, color, shadow);
  };

  // Colour and shadow apply to the whole drawing live — change them any time
  useEffect(() => {
    redraw();
  }, [color, shadow]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      t: Date.now(),
    };
  };

  const emit = () => onChange(canvasRef.current.toDataURL('image/png'));

  const start = (e) => {
    currentRef.current = { points: [getPos(e)], width, style };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e) => {
    const cur = currentRef.current;
    if (!cur) return;
    cur.points.push(getPos(e));
    redraw();
  };

  const end = () => {
    const cur = currentRef.current;
    if (!cur) return;
    currentRef.current = null;
    if (cur.points.length === 1) {
      const p = cur.points[0];
      cur.points.push({ x: p.x + 0.5, y: p.y + 0.5, t: p.t + 8 });
    }
    strokesRef.current.push(cur);
    setHasInk(true);
    redraw();
    emit();
  };

  const tidyUp = () => {
    // Marks each stroke as smoothed — the shaky path is straightened while the
    // original pen speeds (and so the nib-style width variation) are preserved.
    strokesRef.current = strokesRef.current.map((s) => (s.smoothed ? s : { ...s, smoothed: true }));
    redraw();
    emit();
  };

  const undo = () => {
    strokesRef.current.pop();
    setHasInk(strokesRef.current.length > 0);
    redraw();
    onChange(strokesRef.current.length ? canvasRef.current.toDataURL('image/png') : null);
  };

  const clear = () => {
    strokesRef.current = [];
    setHasInk(false);
    redraw();
    onChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Colours — live, applies to what's already drawn */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Colour</span>
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2 transition-colors"
            style={{ backgroundColor: c, borderColor: color === c ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
          title="Custom colour"
        />
      </div>

      {/* Style, size, effects */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Style</span>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PEN_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Size</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="draw-shadow" checked={shadow} onCheckedChange={setShadow} />
          <Label htmlFor="draw-shadow" className="text-xs">Shadow effect</Label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={220}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{
          cursor:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><path d='M14 1v8M14 19v8M1 14h8M19 14h8' stroke='%230f172a' stroke-width='2'/><circle cx='14' cy='14' r='8' fill='rgba(255,255,255,0.75)' stroke='%230f172a' stroke-width='2'/><circle cx='14' cy='14' r='2.5' fill='%23f59e0b' stroke='%230f172a' stroke-width='1'/></svg>\") 14 14, crosshair",
        }}
        className="w-full rounded-lg border-2 border-dashed border-border bg-white touch-none"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Draw with your mouse, finger or stylus. Made a mess? Press <strong>Tidy up</strong> to smooth shaky
          strokes. Colour and shadow apply any time — even after drawing.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={tidyUp} disabled={!hasInk}>
            <Sparkles className="w-3.5 h-3.5" /> Tidy up
          </Button>
          <Button variant="outline" size="sm" onClick={undo} disabled={!hasInk}>
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={clear} disabled={!hasInk}>
            <Eraser className="w-3.5 h-3.5" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}