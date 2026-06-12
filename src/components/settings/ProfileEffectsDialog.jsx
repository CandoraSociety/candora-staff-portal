import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── SVG item builders ─────────────────────────────────────────────────────────
// Each returns a full SVG string. Colour-aware items accept a `color` argument.

const HAIR_COLORS = ['#1a1a1a', '#3b2314', '#6b3a2a', '#8B4513', '#c0831e', '#d4a054', '#e8c98a', '#f5e6c8', '#808080', '#c0c0c0', '#ff4444', '#ff8800', '#4444ff', '#aa44ff'];
const COLOR_LABELS = ['Black', 'Dark Brown', 'Brown', 'Med Brown', 'Auburn', 'Caramel', 'Blonde', 'Platinum', 'Dark Grey', 'Silver', 'Red', 'Orange', 'Blue', 'Purple'];

function svgWrap(content, vb = '0 0 100 100') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${content}</svg>`;
}

// FACIAL HAIR — clean silhouette approach, clearly identifiable shapes
const facialHairSVGs = {

  // Pencil thin moustache — narrow rectangle across upper lip
  moustache_pencil: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><path d="M30,20 Q100,8 170,20 L168,38 Q100,28 32,38 Z" fill="${c}"/></svg>`,

  // Classic Chaplin / toothbrush — small square under nose centre
  moustache_toothbrush: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect x="80" y="10" width="40" height="50" rx="6" fill="${c}"/></svg>`,

  // Chevron — thick full-width, flat bottom
  moustache_chevron: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><path d="M15,50 Q100,5 185,50 L180,65 Q100,25 20,65 Z" fill="${c}"/></svg>`,

  // Walrus — big droopy over the mouth
  moustache_walrus: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M10,15 Q100,0 190,15 L190,55 Q150,75 110,70 Q100,72 90,70 Q50,75 10,55 Z" fill="${c}"/></svg>`,

  // Handlebar — curled ends pointing up
  moustache_handlebar: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M55,50 Q100,20 145,50 Q145,62 130,60 Q100,52 70,60 Q55,62 55,50Z" fill="${c}"/><path d="M55,50 Q30,45 15,30 Q8,18 18,14 Q30,10 38,28 Q44,42 55,50Z" fill="${c}"/><path d="M145,50 Q170,45 185,30 Q192,18 182,14 Q170,10 162,28 Q156,42 145,50Z" fill="${c}"/></svg>`,

  // Fu Manchu — thin centre with long drooping tails
  moustache_fu_manchu: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><path d="M55,22 Q100,5 145,22 L142,45 Q120,55 108,50 L100,52 L92,50 Q80,55 58,45 Z" fill="${c}"/><path d="M58,45 Q52,80 46,120 Q42,150 50,165 Q58,178 62,160 Q64,140 68,110 Q74,80 80,60 L58,45Z" fill="${c}"/><path d="M142,45 Q148,80 154,120 Q158,150 150,165 Q142,178 138,160 Q136,140 132,110 Q126,80 120,60 L142,45Z" fill="${c}"/></svg>`,

  // English — thin waxed, pointed ends pointing outward
  moustache_english: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><path d="M100,30 Q70,15 40,20 Q20,24 5,18 Q18,32 38,34 Q68,38 100,34Z" fill="${c}"/><path d="M100,30 Q130,15 160,20 Q180,24 195,18 Q182,32 162,34 Q132,38 100,34Z" fill="${c}"/></svg>`,

  // Imperial — bushy centre with upward swept sides
  moustache_imperial: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90"><path d="M40,65 Q100,20 160,65 Q145,80 120,72 Q100,66 80,72 Q55,80 40,65Z" fill="${c}"/><path d="M40,65 Q22,55 14,38 Q10,22 22,16 Q34,12 40,30 Q44,48 40,65Z" fill="${c}"/><path d="M160,65 Q178,55 186,38 Q190,22 178,16 Q166,12 160,30 Q156,48 160,65Z" fill="${c}"/></svg>`,

  // Beards
  // Short beard — covers chin and jaw, upper edge follows mouth line
  beard_short: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><path d="M18,30 Q14,65 18,90 Q30,120 100,125 Q170,120 182,90 Q186,65 182,30 Q150,48 100,52 Q50,48 18,30Z" fill="${c}"/></svg>`,

  // Full beard — full coverage from cheekbones to chin
  beard_full: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><path d="M8,15 Q4,65 8,100 Q20,145 100,150 Q180,145 192,100 Q196,65 192,15 Q158,42 100,46 Q42,42 8,15Z" fill="${c}"/></svg>`,

  // Goatee — chin only, pointed at bottom
  beard_goatee: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><path d="M68,10 Q100,0 132,10 L138,60 Q120,100 100,130 Q80,100 62,60 Z" fill="${c}"/></svg>`,

  // Circle beard — goatee connected to moustache ring
  beard_circle: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><path d="M55,10 Q100,0 145,10 L148,35 Q130,48 100,50 Q70,48 52,35 Z" fill="${c}"/><path d="M65,42 Q100,36 135,42 L140,80 Q120,120 100,135 Q80,120 60,80 Z" fill="${c}"/></svg>`,

  // Viking — very wide, long flowing beard with two pointed braids
  beard_viking: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><path d="M5,10 Q0,70 5,110 Q15,155 100,165 Q185,155 195,110 Q200,70 195,10 Q158,42 100,46 Q42,42 5,10Z" fill="${c}"/><path d="M30,130 Q22,155 26,175 Q32,188 38,172 Q42,155 38,130Z" fill="${c}"/><path d="M170,130 Q178,155 174,175 Q168,188 162,172 Q158,155 162,130Z" fill="${c}"/></svg>`,

  // Stubble — dot-matrix texture over jaw/chin area
  beard_stubble: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">${
    Array.from({length: 7}, (_, row) => Array.from({length: 18}, (_, col) => {
      const x = 14 + col * 10 + (row % 2) * 5;
      const y = 8 + row * 13;
      const r = 2.2 + ((col * 3 + row * 5) % 3) * 0.6;
      const op = (0.55 + ((col + row * 2) % 5) * 0.08).toFixed(2);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${op}"/>`;
    }).join('')).join('')
  }</svg>`,

  // Mutton chops — thick sideburns meeting a moustache, no chin
  beard_mutton_chops: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><path d="M5,15 Q0,50 5,80 Q12,105 30,110 Q50,112 60,90 Q70,68 72,45 Q55,38 42,20Z" fill="${c}"/><path d="M195,15 Q200,50 195,80 Q188,105 170,110 Q150,112 140,90 Q130,68 128,45 Q145,38 158,20Z" fill="${c}"/><path d="M55,52 Q100,35 145,52 Q145,68 128,62 Q100,56 72,62 Q55,68 55,52Z" fill="${c}"/></svg>`,

  // Sideburns
  sideburns_short: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M4,10 Q0,35 4,58 Q10,72 22,70 Q34,66 36,48 Q38,28 30,12 Q18,4 4,10Z" fill="${c}"/><path d="M196,10 Q200,35 196,58 Q190,72 178,70 Q166,66 164,48 Q162,28 170,12 Q182,4 196,10Z" fill="${c}"/></svg>`,

  sideburns_long: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M4,10 Q0,55 4,100 Q8,130 22,138 Q36,144 40,120 Q44,92 42,55 Q38,22 26,8 Q14,0 4,10Z" fill="${c}"/><path d="M196,10 Q200,55 196,100 Q192,130 178,138 Q164,144 160,120 Q156,92 158,55 Q162,22 174,8 Q186,0 196,10Z" fill="${c}"/></svg>`,

  sideburns_chops: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M2,10 Q-2,58 2,100 Q8,130 28,138 Q48,144 58,115 Q66,88 64,55 Q58,22 40,8 Q20,-2 2,10Z" fill="${c}"/><path d="M198,10 Q202,58 198,100 Q192,130 172,138 Q152,144 142,115 Q134,88 136,55 Q142,22 160,8 Q180,-2 198,10Z" fill="${c}"/></svg>`,
};

// EYEWEAR — transparent lenses
const eyewearSVGs = {
  glasses_round: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><ellipse cx="27" cy="20" rx="17" ry="14" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><ellipse cx="73" cy="20" rx="17" ry="14" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><line x1="44" y1="20" x2="56" y2="20" stroke="#555" stroke-width="2"/><line x1="2" y1="18" x2="10" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="18" x2="90" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  glasses_square: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect x="8" y="8" width="36" height="26" rx="3" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><rect x="56" y="8" width="36" height="26" rx="3" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><line x1="44" y1="21" x2="56" y2="21" stroke="#555" stroke-width="2"/><line x1="2" y1="16" x2="8" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="16" x2="92" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  glasses_cat_eye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><path d="M8,22 Q10,8 26,6 Q36,6 40,14 Q42,20 40,28 Q36,34 26,32 Q12,30 8,22Z" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><path d="M92,22 Q90,8 74,6 Q64,6 60,14 Q58,20 60,28 Q64,34 74,32 Q88,30 92,22Z" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><line x1="42" y1="20" x2="58" y2="20" stroke="#555" stroke-width="2"/><line x1="2" y1="18" x2="8" y2="22" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="18" x2="92" y2="22" stroke="#333" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  glasses_aviator: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 44"><path d="M10,14 Q10,6 26,6 Q42,6 42,16 Q42,30 26,32 Q10,30 10,14Z" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><path d="M58,14 Q58,6 74,6 Q90,6 90,16 Q90,30 74,32 Q58,30 58,14Z" fill="rgba(200,230,255,0.25)" stroke="#333" stroke-width="2.5"/><path d="M42,12 Q50,10 58,12" fill="none" stroke="#555" stroke-width="2"/><line x1="2" y1="14" x2="10" y2="14" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="14" x2="90" y2="14" stroke="#333" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  glasses_rimless: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><ellipse cx="27" cy="20" rx="17" ry="13" fill="rgba(200,230,255,0.15)" stroke="#666" stroke-width="1" stroke-dasharray="0"/><ellipse cx="73" cy="20" rx="17" ry="13" fill="rgba(200,230,255,0.15)" stroke="#666" stroke-width="1"/><line x1="44" y1="20" x2="56" y2="20" stroke="#888" stroke-width="1.5"/><line x1="2" y1="18" x2="10" y2="20" stroke="#888" stroke-width="1.5" stroke-linecap="round"/><line x1="98" y1="18" x2="90" y2="20" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  glasses_thick_hipster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 42"><rect x="6" y="7" width="38" height="28" rx="6" fill="rgba(200,230,255,0.2)" stroke="#1a1a1a" stroke-width="5"/><rect x="56" y="7" width="38" height="28" rx="6" fill="rgba(200,230,255,0.2)" stroke="#1a1a1a" stroke-width="5"/><line x1="44" y1="21" x2="56" y2="21" stroke="#1a1a1a" stroke-width="4"/><line x1="2" y1="16" x2="6" y2="20" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/><line x1="98" y1="16" x2="94" y2="20" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/></svg>`,
  monocle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><circle cx="30" cy="26" r="22" fill="rgba(200,230,255,0.2)" stroke="#8B6914" stroke-width="3"/><circle cx="30" cy="26" r="18" fill="none" stroke="#8B6914" stroke-width="1" opacity="0.4"/><line x1="50" y1="44" x2="56" y2="70" stroke="#8B6914" stroke-width="2"/><circle cx="56" cy="72" r="2" fill="#8B6914"/></svg>`,
  sunglasses_wayfarer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 42"><rect x="6" y="8" width="38" height="26" rx="4" fill="rgba(10,10,30,0.85)" stroke="#222" stroke-width="2.5"/><rect x="56" y="8" width="38" height="26" rx="4" fill="rgba(10,10,30,0.85)" stroke="#222" stroke-width="2.5"/><line x1="44" y1="21" x2="56" y2="21" stroke="#333" stroke-width="2"/><line x1="2" y1="16" x2="6" y2="20" stroke="#222" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="16" x2="94" y2="20" stroke="#222" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  sunglasses_round: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><ellipse cx="27" cy="20" rx="17" ry="14" fill="rgba(10,10,30,0.85)" stroke="#333" stroke-width="2.5"/><ellipse cx="73" cy="20" rx="17" ry="14" fill="rgba(10,10,30,0.85)" stroke="#333" stroke-width="2.5"/><line x1="44" y1="20" x2="56" y2="20" stroke="#444" stroke-width="2"/><line x1="2" y1="18" x2="10" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="18" x2="90" y2="20" stroke="#333" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  sunglasses_oversized: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 46"><ellipse cx="27" cy="24" rx="22" ry="18" fill="rgba(10,10,30,0.88)" stroke="#111" stroke-width="3"/><ellipse cx="73" cy="24" rx="22" ry="18" fill="rgba(10,10,30,0.88)" stroke="#111" stroke-width="3"/><line x1="49" y1="24" x2="51" y2="24" stroke="#222" stroke-width="2"/><line x1="1" y1="18" x2="5" y2="22" stroke="#111" stroke-width="3" stroke-linecap="round"/><line x1="99" y1="18" x2="95" y2="22" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>`,
  sunglasses_gradient: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 42"><defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(10,10,80,0.9)"/><stop offset="100%" stop-color="rgba(10,10,80,0.2)"/></linearGradient></defs><rect x="6" y="8" width="38" height="26" rx="10" fill="url(#gl)" stroke="#334" stroke-width="2.5"/><rect x="56" y="8" width="38" height="26" rx="10" fill="url(#gl)" stroke="#334" stroke-width="2.5"/><line x1="44" y1="21" x2="56" y2="21" stroke="#334" stroke-width="2"/><line x1="2" y1="16" x2="6" y2="20" stroke="#334" stroke-width="2.5" stroke-linecap="round"/><line x1="98" y1="16" x2="94" y2="20" stroke="#334" stroke-width="2.5" stroke-linecap="round"/></svg>`,
};

// HATS — realistic
const hatSVGs = {
  top_hat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><rect x="20" y="8" width="60" height="62" rx="4" fill="#111"/><rect x="8" y="66" width="84" height="14" rx="6" fill="#111"/><rect x="20" y="68" width="60" height="4" fill="#333"/></svg>`,
  fedora: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path d="M30,50 Q30,20 50,18 Q70,20 70,50" fill="#5c4033"/><path d="M28,52 Q20,54 8,56 Q16,60 50,62 Q84,60 92,56 Q80,54 72,52 Q70,52 50,52 Q30,52 28,52Z" fill="#5c4033"/><path d="M30,50 Q30,30 50,28 Q70,30 70,50" fill="#4a3028" opacity="0.5"/><path d="M10,56 Q50,66 90,56" fill="none" stroke="#3a2018" stroke-width="2"/></svg>`,
  beanie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><path d="M10,60 Q14,28 50,20 Q86,28 90,60" fill="#c0392b"/><rect x="8" y="56" width="84" height="14" rx="6" fill="#a93226"/><path d="M18,56 Q50,62 82,56" fill="none" stroke="#922b21" stroke-width="2"/><circle cx="50" cy="20" r="8" fill="#e74c3c"/></svg>`,
  crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path d="M10,60 L10,30 L30,50 L50,10 L70,50 L90,30 L90,60 Z" fill="#f1c40f"/><rect x="8" y="58" width="84" height="10" rx="4" fill="#e67e22"/><circle cx="50" cy="12" r="5" fill="#e74c3c"/><circle cx="10" cy="30" r="4" fill="#e74c3c"/><circle cx="90" cy="30" r="4" fill="#e74c3c"/></svg>`,
  bucket_hat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><path d="M22,60 Q24,28 50,24 Q76,28 78,60" fill="#7f8c8d"/><path d="M6,60 Q8,66 50,70 Q92,66 94,60 Q78,58 50,58 Q22,58 6,60Z" fill="#636e72"/></svg>`,
  baseball_cap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><path d="M10,56 Q12,28 50,24 Q88,28 90,56 Q70,60 50,60 Q30,60 10,56Z" fill="#2980b9"/><path d="M8,58 Q6,66 50,66 Q62,64 90,58" fill="none" stroke="#21618c" stroke-width="2"/><path d="M86,50 Q96,54 98,62 Q90,58 86,56" fill="#2980b9"/><rect x="44" y="24" width="12" height="6" rx="3" fill="#1a6a9a"/></svg>`,
  cowboy_hat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80"><path d="M30,56 Q32,24 55,22 Q78,24 80,56" fill="#8B6914"/><path d="M4,58 Q10,50 30,54 Q30,58 55,60 Q80,58 80,54 Q100,50 106,58 Q90,68 55,70 Q20,68 4,58Z" fill="#7d5e12"/><path d="M6,58 Q55,72 104,58" fill="none" stroke="#5d4209" stroke-width="2"/></svg>`,
  santa_hat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><path d="M50,10 Q80,20 78,56 Q64,50 20,60 Q22,30 50,10Z" fill="#c0392b"/><rect x="12" y="56" width="70" height="16" rx="8" fill="white"/><circle cx="50" cy="12" r="8" fill="white"/></svg>`,
  graduation_cap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><path d="M14,44 L50,28 L86,44 L50,60 Z" fill="#1a1a1a"/><path d="M28,50 Q28,66 50,70 Q72,66 72,50 Q60,56 50,56 Q40,56 28,50Z" fill="#1a1a1a"/><rect x="50" y="28" width="30" height="4" rx="2" fill="#555" transform="rotate(20,65,30)"/><circle cx="80" cy="42" r="3" fill="#f1c40f"/><line x1="80" y1="45" x2="80" y2="62" stroke="#f1c40f" stroke-width="2"/></svg>`,
};

// NECKLACES — profile-photo friendly (hang across collar area)
const necklaceSVGs = {
  necklace_simple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10,10 Q50,40 90,10" fill="none" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  necklace_pendant_heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path d="M10,10 Q50,38 90,10" fill="none" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round"/><path d="M50,38 L50,46" stroke="#c8a96e" stroke-width="2"/><path d="M50,56 C50,56 42,50 42,46 A4,4 0 0,1 50,44 A4,4 0 0,1 58,46 C58,50 50,56 50,56Z" fill="#c0392b"/></svg>`,
  necklace_pendant_cross: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 72"><path d="M10,10 Q50,36 90,10" fill="none" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round"/><path d="M50,36 L50,50" stroke="#c8a96e" stroke-width="2"/><rect x="47" y="48" width="6" height="16" rx="1" fill="#c8a96e"/><rect x="43" y="53" width="14" height="5" rx="1" fill="#c8a96e"/></svg>`,
  necklace_pearl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10,10 Q50,40 90,10" fill="none" stroke="#e8e0d0" stroke-width="1.5" stroke-linecap="round"/><circle cx="50" cy="37" r="4" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="42" cy="32" r="3.5" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="58" cy="32" r="3.5" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="34" cy="26" r="3" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="66" cy="26" r="3" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="26" cy="20" r="3" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="74" cy="20" r="3" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="18" cy="14" r="2.5" fill="white" stroke="#c0b8a8" stroke-width="0.8"/><circle cx="82" cy="14" r="2.5" fill="white" stroke="#c0b8a8" stroke-width="0.8"/></svg>`,
  necklace_gold_chain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 55"><path d="M10,8 Q50,38 90,8" fill="none" stroke="#d4af37" stroke-width="4" stroke-linecap="round" stroke-dasharray="6,3"/></svg>`,
  necklace_silver_chain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 55"><path d="M10,8 Q50,38 90,8" fill="none" stroke="#c0c0c0" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="5,2.5"/></svg>`,
  necklace_diamond_pendant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 72"><path d="M10,10 Q50,36 90,10" fill="none" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round"/><path d="M50,36 L50,44" stroke="#c8a96e" stroke-width="1.5"/><polygon points="50,44 56,51 50,60 44,51" fill="#a8d8ea" stroke="#c8a96e" stroke-width="1"/></svg>`,
  necklace_layered: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path d="M12,10 Q50,34 88,10" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round"/><path d="M8,16 Q50,44 92,16" fill="none" stroke="#c0c0c0" stroke-width="1.5" stroke-linecap="round"/><path d="M6,22 Q50,54 94,22" fill="none" stroke="#d4af37" stroke-width="1" stroke-linecap="round"/></svg>`,
  necklace_choker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><path d="M6,14 Q50,22 94,14" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="18" r="4" fill="#111"/></svg>`,
};

// PIERCINGS — small, realistic placement overlays
const piercingSVGs = {
  piercing_nostril_stud: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="60" cy="62" r="4" fill="#c0c0c0"/><circle cx="60" cy="62" r="2" fill="white"/></svg>`,
  piercing_septum_ring: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M36,10 Q50,30 64,10" fill="none" stroke="#c0c0c0" stroke-width="3" stroke-linecap="round"/></svg>`,
  piercing_eyebrow_bar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40"><line x1="15" y1="4" x2="15" y2="36" stroke="#c0c0c0" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="4" r="4" fill="#c0c0c0"/><circle cx="15" cy="36" r="4" fill="#c0c0c0"/></svg>`,
  piercing_lip_ring: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30"><path d="M8,6 Q20,24 32,6" fill="none" stroke="#c0c0c0" stroke-width="3" stroke-linecap="round"/></svg>`,
  piercing_ear_studs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="8" cy="45" r="5" fill="#c8a96e"/><circle cx="8" cy="45" r="2.5" fill="white"/><circle cx="92" cy="45" r="5" fill="#c8a96e"/><circle cx="92" cy="45" r="2.5" fill="white"/></svg>`,
  piercing_ear_rings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="8" cy="50" r="10" fill="none" stroke="#c8a96e" stroke-width="2.5"/><circle cx="92" cy="50" r="10" fill="none" stroke="#c8a96e" stroke-width="2.5"/></svg>`,
  piercing_bridge: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 20"><line x1="8" y1="10" x2="52" y2="10" stroke="#c0c0c0" stroke-width="2.5"/><circle cx="8" cy="10" r="4" fill="#c0c0c0"/><circle cx="52" cy="10" r="4" fill="#c0c0c0"/></svg>`,
  piercing_monroe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="58" cy="74" r="4.5" fill="#c0c0c0"/><circle cx="58" cy="74" r="2" fill="white"/></svg>`,
};

// TATTOOS — line-art style, realistic
const tattooSVGs = {
  tattoo_anchor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><line x1="30" y1="8" x2="30" y2="68" stroke="#1a1a2e" stroke-width="2.5"/><circle cx="30" cy="16" r="8" fill="none" stroke="#1a1a2e" stroke-width="2.5"/><path d="M18,68 Q30,76 42,68" fill="none" stroke="#1a1a2e" stroke-width="2.5"/><path d="M8,42 Q18,38 18,50" fill="none" stroke="#1a1a2e" stroke-width="2.5"/><path d="M52,42 Q42,38 42,50" fill="none" stroke="#1a1a2e" stroke-width="2.5"/></svg>`,
  tattoo_rose: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M30,12 C36,12 42,18 42,24 C42,32 36,36 30,40 C24,36 18,32 18,24 C18,18 24,12 30,12Z" fill="#8b0000" opacity="0.85"/><path d="M28,10 C22,8 18,12 20,18" fill="#8b0000" opacity="0.7"/><path d="M32,10 C38,8 42,12 40,18" fill="#8b0000" opacity="0.7"/><path d="M30,40 Q28,52 26,60 Q30,64 34,60 Q32,52 30,40Z" fill="#1a5c1a" stroke="#0d3b0d" stroke-width="0.5"/><path d="M26,50 Q20,48 18,52 Q22,56 28,54" fill="#1a5c1a"/><path d="M34,50 Q40,48 42,52 Q38,56 32,54" fill="#1a5c1a"/></svg>`,
  tattoo_skull: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70"><ellipse cx="30" cy="28" rx="22" ry="22" fill="#e0d8cc" stroke="#333" stroke-width="1.5"/><rect x="18" y="46" width="24" height="12" rx="2" fill="#c8c0b0" stroke="#333" stroke-width="1.5"/><ellipse cx="23" cy="30" rx="7" ry="8" fill="#333"/><ellipse cx="37" cy="30" rx="7" ry="8" fill="#333"/><path d="M25,42 L28,46 L32,46 L35,42" fill="none" stroke="#333" stroke-width="1.5"/><line x1="26" y1="10" x2="28" y2="8" stroke="#333" stroke-width="1"/><line x1="30" y1="8" x2="30" y2="6" stroke="#333" stroke-width="1"/><line x1="34" y1="10" x2="32" y2="8" stroke="#333" stroke-width="1"/></svg>`,
  tattoo_heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 55"><path d="M30,48 C30,48 6,34 6,18 A12,12 0 0,1 30,14 A12,12 0 0,1 54,18 C54,34 30,48 30,48Z" fill="#8b0000" stroke="#600000" stroke-width="1.5"/></svg>`,
  tattoo_tribal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><path d="M10,30 C14,20 22,16 30,20 C36,24 40,32 46,28 C52,24 54,14 62,16 C70,18 72,28 70,36 C68,42 60,44 54,40 C48,36 46,28 40,32 C34,36 32,44 24,44 C16,44 10,38 10,30Z" fill="#1a1a2e" opacity="0.9"/></svg>`,
  tattoo_dragon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><path d="M40,10 C50,14 58,22 56,32 C54,40 46,44 44,52 C42,60 46,68 44,76 C42,82 36,84 32,80" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round"/><path d="M56,32 C62,28 68,30 68,36 C68,42 62,44 56,40" fill="#1a1a2e"/><path d="M40,10 C38,4 32,2 30,8 C32,10 36,12 40,10Z" fill="#1a1a2e"/><path d="M44,52 C38,50 34,46 36,52 C34,56 30,58 34,62" fill="none" stroke="#1a1a2e" stroke-width="2"/></svg>`,
  tattoo_compass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70"><circle cx="35" cy="35" r="28" fill="none" stroke="#1a1a2e" stroke-width="2"/><circle cx="35" cy="35" r="22" fill="none" stroke="#1a1a2e" stroke-width="1"/><polygon points="35,10 39,32 35,26 31,32" fill="#1a1a2e"/><polygon points="35,60 31,38 35,44 39,38" fill="#555"/><polygon points="10,35 32,31 26,35 32,39" fill="#555"/><polygon points="60,35 38,39 44,35 38,31" fill="#1a1a2e"/><circle cx="35" cy="35" r="3" fill="#1a1a2e"/></svg>`,
  tattoo_infinity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M40,20 C40,20 32,6 20,6 C10,6 4,12 4,20 C4,28 10,34 20,34 C32,34 40,20 40,20 C40,20 48,6 60,6 C70,6 76,12 76,20 C76,28 70,34 60,34 C48,34 40,20 40,20Z" fill="none" stroke="#1a1a2e" stroke-width="3"/></svg>`,
  tattoo_feather: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 90"><path d="M25,6 Q30,20 28,40 Q26,60 24,80" fill="none" stroke="#1a1a2e" stroke-width="2"/><path d="M25,10 C36,14 40,22 34,28 C30,32 26,28 25,24" fill="#1a1a2e" opacity="0.7"/><path d="M25,20 C34,24 38,32 32,36 C28,40 25,36 24,32" fill="#1a1a2e" opacity="0.6"/><path d="M25,32 C32,36 36,44 30,48 C26,52 24,46 24,42" fill="#1a1a2e" opacity="0.5"/></svg>`,
  tattoo_butterfly: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><path d="M40,30 C40,30 20,20 10,10 C4,4 6,18 14,24 C22,30 36,30 40,30Z" fill="#4a0080" opacity="0.85"/><path d="M40,30 C40,30 60,20 70,10 C76,4 74,18 66,24 C58,30 44,30 40,30Z" fill="#4a0080" opacity="0.85"/><path d="M40,30 C40,30 24,38 16,50 C12,56 22,54 28,48 C34,42 38,32 40,30Z" fill="#6a00b0" opacity="0.8"/><path d="M40,30 C40,30 56,38 64,50 C68,56 58,54 52,48 C46,42 42,32 40,30Z" fill="#6a00b0" opacity="0.8"/><ellipse cx="40" cy="30" rx="2" ry="10" fill="#1a1a2e"/></svg>`,
  tattoo_wolf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 80"><path d="M20,20 L14,6 L24,16 L35,8 L46,16 L56,6 L50,20 Q56,28 54,38 Q52,48 35,55 Q18,48 16,38 Q14,28 20,20Z" fill="#555" stroke="#333" stroke-width="1.5"/><polygon points="35,8 30,18 35,16 40,18" fill="#888"/><ellipse cx="26" cy="30" rx="5" ry="6" fill="#1a1a2e"/><ellipse cx="44" cy="30" rx="5" ry="6" fill="#1a1a2e"/><path d="M28,42 Q35,46 42,42" fill="none" stroke="#333" stroke-width="1.5"/></svg>`,
};

// ── Colour picker for hair-tinted items ──────────────────────────────────────
function ColorPicker({ selectedColor, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg">
      {HAIR_COLORS.map((c, i) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={COLOR_LABELS[i]}
          style={{ background: c, width: 22, height: 22, borderRadius: '50%', border: selectedColor === c ? '3px solid #6366f1' : '2px solid rgba(0,0,0,0.2)', cursor: 'pointer', flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

// ── Resolve item src (dynamic SVG string or static URL) ─────────────────────
function resolveItemSrc(item, color) {
  if (item.svgFn) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svgFn(color))}`;
  if (item.svg) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svg)}`;
  return item.src || '';
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: '🎩 Hats',
    colorable: false,
    items: [
      { id: 'tophat',    label: 'Top Hat',    svg: hatSVGs.top_hat },
      { id: 'fedora',    label: 'Fedora',     svg: hatSVGs.fedora },
      { id: 'beanie',    label: 'Beanie',     svg: hatSVGs.beanie },
      { id: 'crown',     label: 'Crown',      svg: hatSVGs.crown },
      { id: 'bucket',    label: 'Bucket Hat', svg: hatSVGs.bucket_hat },
      { id: 'baseball',  label: 'Cap',        svg: hatSVGs.baseball_cap },
      { id: 'cowboy',    label: 'Cowboy',     svg: hatSVGs.cowboy_hat },
      { id: 'santa',     label: 'Santa',      svg: hatSVGs.santa_hat },
      { id: 'grad',      label: 'Grad Cap',   svg: hatSVGs.graduation_cap },
    ],
  },
  {
    label: '👓 Eyewear',
    colorable: false,
    items: [
      { id: 'gl_round',       label: 'Round',          svg: eyewearSVGs.glasses_round },
      { id: 'gl_square',      label: 'Square',         svg: eyewearSVGs.glasses_square },
      { id: 'gl_cateye',      label: 'Cat-Eye',        svg: eyewearSVGs.glasses_cat_eye },
      { id: 'gl_aviator',     label: 'Aviator',        svg: eyewearSVGs.glasses_aviator },
      { id: 'gl_rimless',     label: 'Rimless',        svg: eyewearSVGs.glasses_rimless },
      { id: 'gl_hipster',     label: 'Thick Frame',    svg: eyewearSVGs.glasses_thick_hipster },
      { id: 'monocle',        label: 'Monocle',        svg: eyewearSVGs.monocle },
      { id: 'sg_wayfarer',    label: 'Wayfarer Suns',  svg: eyewearSVGs.sunglasses_wayfarer },
      { id: 'sg_round',       label: 'Round Suns',     svg: eyewearSVGs.sunglasses_round },
      { id: 'sg_oversized',   label: 'Oversized Suns', svg: eyewearSVGs.sunglasses_oversized },
      { id: 'sg_gradient',    label: 'Gradient Suns',  svg: eyewearSVGs.sunglasses_gradient },
    ],
  },
  {
    label: '🥸 Facial Hair',
    colorable: true,
    items: [
      { id: 'mou_pencil',      label: 'Pencil',        svgFn: facialHairSVGs.moustache_pencil },
      { id: 'mou_toothbrush', label: 'Toothbrush',   svgFn: facialHairSVGs.moustache_toothbrush },
      { id: 'mou_chevron',    label: 'Chevron',       svgFn: facialHairSVGs.moustache_chevron },
      { id: 'mou_walrus',     label: 'Walrus',        svgFn: facialHairSVGs.moustache_walrus },
      { id: 'mou_handlebar',  label: 'Handlebar',     svgFn: facialHairSVGs.moustache_handlebar },
      { id: 'mou_fumanchu',   label: 'Fu Manchu',     svgFn: facialHairSVGs.moustache_fu_manchu },
      { id: 'mou_english',    label: 'English',       svgFn: facialHairSVGs.moustache_english },
      { id: 'mou_imperial',   label: 'Imperial',      svgFn: facialHairSVGs.moustache_imperial },
      { id: 'brd_short',     label: 'Short Beard',   svgFn: facialHairSVGs.beard_short },
      { id: 'brd_full',      label: 'Full Beard',    svgFn: facialHairSVGs.beard_full },
      { id: 'brd_goatee',    label: 'Goatee',        svgFn: facialHairSVGs.beard_goatee },
      { id: 'brd_circle',    label: 'Circle Beard',  svgFn: facialHairSVGs.beard_circle },
      { id: 'brd_viking',    label: 'Viking',        svgFn: facialHairSVGs.beard_viking },
      { id: 'brd_stubble',   label: 'Stubble',       svgFn: facialHairSVGs.beard_stubble },
      { id: 'brd_mutton',    label: 'Mutton Chops',  svgFn: facialHairSVGs.beard_mutton_chops },
      { id: 'sid_short',     label: 'Sideburns S',   svgFn: facialHairSVGs.sideburns_short },
      { id: 'sid_long',      label: 'Sideburns L',   svgFn: facialHairSVGs.sideburns_long },
      { id: 'sid_chops',     label: 'Chop Burns',    svgFn: facialHairSVGs.sideburns_chops },
    ],
  },
  {
    label: '💎 Necklaces',
    colorable: false,
    items: [
      { id: 'neck_simple',    label: 'Thin Chain',    svg: necklaceSVGs.necklace_simple },
      { id: 'neck_gold',      label: 'Gold Chain',    svg: necklaceSVGs.necklace_gold_chain },
      { id: 'neck_silver',    label: 'Silver Chain',  svg: necklaceSVGs.necklace_silver_chain },
      { id: 'neck_pearl',     label: 'Pearls',        svg: necklaceSVGs.necklace_pearl },
      { id: 'neck_heart',     label: 'Heart Pendant', svg: necklaceSVGs.necklace_pendant_heart },
      { id: 'neck_cross',     label: 'Cross',         svg: necklaceSVGs.necklace_pendant_cross },
      { id: 'neck_diamond',   label: 'Diamond Drop',  svg: necklaceSVGs.necklace_diamond_pendant },
      { id: 'neck_layered',   label: 'Layered',       svg: necklaceSVGs.necklace_layered },
      { id: 'neck_choker',    label: 'Choker',        svg: necklaceSVGs.necklace_choker },
    ],
  },
  {
    label: '💉 Piercings',
    colorable: false,
    items: [
      { id: 'pier_nostril',   label: 'Nostril Stud',  svg: piercingSVGs.piercing_nostril_stud },
      { id: 'pier_septum',    label: 'Septum Ring',   svg: piercingSVGs.piercing_septum_ring },
      { id: 'pier_eyebrow',   label: 'Eyebrow Bar',   svg: piercingSVGs.piercing_eyebrow_bar },
      { id: 'pier_lip',       label: 'Lip Ring',      svg: piercingSVGs.piercing_lip_ring },
      { id: 'pier_studs',     label: 'Ear Studs',     svg: piercingSVGs.piercing_ear_studs },
      { id: 'pier_rings',     label: 'Ear Rings',     svg: piercingSVGs.piercing_ear_rings },
      { id: 'pier_bridge',    label: 'Bridge',        svg: piercingSVGs.piercing_bridge },
      { id: 'pier_monroe',    label: 'Monroe',        svg: piercingSVGs.piercing_monroe },
    ],
  },
  {
    label: '🖋️ Tattoos',
    colorable: false,
    items: [
      { id: 'tat_anchor',    label: 'Anchor',    svg: tattooSVGs.tattoo_anchor },
      { id: 'tat_rose',      label: 'Rose',      svg: tattooSVGs.tattoo_rose },
      { id: 'tat_skull',     label: 'Skull',     svg: tattooSVGs.tattoo_skull },
      { id: 'tat_heart',     label: 'Heart',     svg: tattooSVGs.tattoo_heart },
      { id: 'tat_tribal',    label: 'Tribal',    svg: tattooSVGs.tattoo_tribal },
      { id: 'tat_dragon',    label: 'Dragon',    svg: tattooSVGs.tattoo_dragon },
      { id: 'tat_compass',   label: 'Compass',   svg: tattooSVGs.tattoo_compass },
      { id: 'tat_infinity',  label: 'Infinity',  svg: tattooSVGs.tattoo_infinity },
      { id: 'tat_feather',   label: 'Feather',   svg: tattooSVGs.tattoo_feather },
      { id: 'tat_butterfly', label: 'Butterfly', svg: tattooSVGs.tattoo_butterfly },
      { id: 'tat_wolf',      label: 'Wolf',      svg: tattooSVGs.tattoo_wolf },
    ],
  },
];

// ── Draggable sticker overlay ────────────────────────────────────────────────
function StickerOverlay({ sticker, isSelected, onSelect, onUpdate, onDelete, containerSize }) {
  const dragStart = useRef(null);
  const rotateStart = useRef(null);
  const resizeStart = useRef(null);

  const handleDragMouseDown = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    dragStart.current = { mx: e.clientX, my: e.clientY, sx: sticker.x, sy: sticker.y };
    const onMove = (mv) => {
      onUpdate(sticker.id, {
        x: dragStart.current.sx + (mv.clientX - dragStart.current.mx) / containerSize,
        y: dragStart.current.sy + (mv.clientY - dragStart.current.my) / containerSize,
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchDrag = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    const t0 = e.touches[0];
    dragStart.current = { mx: t0.clientX, my: t0.clientY, sx: sticker.x, sy: sticker.y };
    const onMove = (mv) => {
      const t = mv.touches[0];
      onUpdate(sticker.id, {
        x: dragStart.current.sx + (t.clientX - dragStart.current.mx) / containerSize,
        y: dragStart.current.sy + (t.clientY - dragStart.current.my) / containerSize,
      });
    };
    const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleRotateMouseDown = (e) => {
    e.stopPropagation();
    const cx = sticker.x * containerSize;
    const cy = sticker.y * containerSize;
    rotateStart.current = { startAngle: Math.atan2(e.clientY - cy, e.clientX - cx), origRot: sticker.rotation || 0 };
    const onMove = (mv) => {
      const angle = Math.atan2(mv.clientY - cy, mv.clientX - cx);
      onUpdate(sticker.id, { rotation: rotateStart.current.origRot + (angle - rotateStart.current.startAngle) * (180 / Math.PI) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    resizeStart.current = { mx: e.clientX, origSize: sticker.size };
    const onMove = (mv) => {
      const newSize = Math.max(0.05, Math.min(1.0, resizeStart.current.origSize + (mv.clientX - resizeStart.current.mx) / containerSize));
      onUpdate(sticker.id, { size: newSize });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const px = sticker.x * containerSize;
  const py = sticker.y * containerSize;
  const sizePx = sticker.size * containerSize;
  const rot = sticker.rotation || 0;

  return (
    <div
      style={{ position: 'absolute', left: px, top: py, width: sizePx, height: sizePx, transform: `translate(-50%,-50%) rotate(${rot}deg)`, cursor: 'grab', userSelect: 'none', zIndex: isSelected ? 10 : 5, touchAction: 'none' }}
      onMouseDown={handleDragMouseDown}
      onTouchStart={handleTouchDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(sticker.id); }}
    >
      <img src={sticker.resolvedSrc} alt={sticker.label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} draggable={false} />
      {isSelected && (
        <>
          <div style={{ position: 'absolute', inset: -3, border: '2px dashed rgba(99,102,241,0.9)', borderRadius: 6, pointerEvents: 'none' }} />
          <button onMouseDown={(e) => { e.stopPropagation(); onDelete(sticker.id); }} style={{ position: 'absolute', top: -14, right: -14, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 'bold', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>✕</button>
          <div onMouseDown={handleRotateMouseDown} style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: '#6366f1', border: '2px solid white', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>↻</div>
          <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: -12, right: -12, width: 22, height: 22, borderRadius: '50%', background: '#6366f1', border: '2px solid white', cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>⤡</div>
        </>
      )}
    </div>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────
export default function ProfileEffectsDialog({ open, imageSrc, onSave, onClose, initialStickers = [], initialHairColor = '#1a1a1a' }) {
  const canvasRef = useRef(null);
  const [stickers, setStickers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [hairColor, setHairColor] = useState('#1a1a1a');
  const [isSaving, setIsSaving] = useState(false);
  const CONTAINER_SIZE = 380;

  useEffect(() => {
    if (open) {
      setStickers(initialStickers);
      setHairColor(initialHairColor);
      setSelectedId(null);
    }
  }, [open, imageSrc]);

  const addSticker = (item) => {
    const id = `${item.id}_${Date.now()}`;
    const resolvedSrc = resolveItemSrc(item, hairColor);
    setStickers(prev => [...prev, { ...item, id, resolvedSrc, color: hairColor, x: 0.5, y: 0.5, size: 0.4, rotation: 0 }]);
    setSelectedId(id);
  };

  const updateSticker = (id, changes) => setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  const deleteSticker = (id) => { setStickers(prev => prev.filter(s => s.id !== id)); if (selectedId === id) setSelectedId(null); };

  // When hair colour changes, re-render colour-aware stickers
  const handleHairColorChange = (c) => {
    setHairColor(c);
    setStickers(prev => prev.map(s => s.svgFn ? { ...s, color: c, resolvedSrc: resolveItemSrc(s, c) } : s));
  };

  const exportImage = useCallback(() => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    const size = 400;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const scale = size / CONTAINER_SIZE;
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = async () => {
      ctx.drawImage(baseImg, 0, 0, size, size);
      for (const s of stickers) {
        await new Promise((res) => {
          const img = new Image();
          img.onload = () => {
            const cx = s.x * size, cy = s.y * size;
            const sp = s.size * CONTAINER_SIZE * scale;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
            ctx.drawImage(img, -sp / 2, -sp / 2, sp, sp);
            ctx.restore();
            res();
          };
          img.onerror = () => res();
          img.src = s.resolvedSrc;
        });
      }
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    baseImg.onerror = reject;
    baseImg.src = imageSrc;
  }), [stickers, imageSrc]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataUrl = await exportImage();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'profile-effect.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onSave(file_url, stickers, hairColor);
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const cat = CATEGORIES[activeCategory];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col gap-4 p-4">
        <DialogHeader>
          <DialogTitle>Add Effects</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              onClick={() => setSelectedId(null)}
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e2e8f0', flexShrink: 0 }}
            >
              {imageSrc && <img src={imageSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />}
              {stickers.map(s => (
                <StickerOverlay key={s.id} sticker={s} isSelected={selectedId === s.id} onSelect={setSelectedId} onUpdate={updateSticker} onDelete={deleteSticker} containerSize={CONTAINER_SIZE} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[380px]">
              {selectedId ? 'Drag · ↻ rotate · ⤡ resize · ✕ remove' : 'Click an item to add it to your photo'}
            </p>
            {stickers.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-[380px]">
                {stickers.map(s => (
                  <div key={s.id} onClick={() => setSelectedId(s.id)} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-colors ${selectedId === s.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}>
                    <img src={s.resolvedSrc} alt={s.label} className="w-4 h-4 object-contain" />
                    <span>{s.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteSticker(s.id); }} className="text-muted-foreground hover:text-destructive ml-0.5">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Picker */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c, i) => (
                <button key={i} onClick={() => setActiveCategory(i)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${activeCategory === i ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-accent/50 bg-background'}`}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Colour picker for facial hair */}
            {cat.colorable && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Hair Colour</p>
                <ColorPicker selectedColor={hairColor} onChange={handleHairColorChange} />
              </div>
            )}

            {/* Items grid */}
            <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[320px] pr-1">
              {cat.items.map(item => {
                const preview = resolveItemSrc(item, hairColor);
                return (
                  <button key={item.id} onClick={() => addSticker(item)} title={item.label} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border hover:border-accent/70 hover:bg-accent/5 transition-all hover:scale-105 active:scale-95">
                    <img src={preview} alt={item.label} className="w-12 h-12 object-contain" />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex justify-between items-center border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => { setStickers([]); setSelectedId(null); }} disabled={stickers.length === 0}>
            <RotateCcw className="w-4 h-4 mr-1" /> Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1" />}
              {isSaving ? 'Saving...' : 'Save Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}