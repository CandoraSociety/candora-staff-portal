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

// FACIAL HAIR — stroked hair-strand approach for natural look
// Each style uses many thin stroke lines layered over a soft base shape
const facialHairSVGs = {

  moustache_pencil: (c) => svgWrap(`
    <defs>
      <linearGradient id="mpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="mpc"><path d="M20,51 C28,46 38,44 50,45 C62,44 72,46 80,51 C76,57 64,58 50,58 C36,58 24,57 20,51Z"/></clipPath>
    </defs>
    <path d="M20,51 C28,46 38,44 50,45 C62,44 72,46 80,51 C76,57 64,58 50,58 C36,58 24,57 20,51Z" fill="url(#mpg)"/>
    <g clip-path="url(#mpc)" opacity="0.6">
      <line x1="24" y1="50" x2="24" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="27" y1="48" x2="27" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="30" y1="47" x2="30" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="33" y1="46" x2="33" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="36" y1="46" x2="36" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="39" y1="45" x2="39" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="42" y1="45" x2="42" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="45" y1="45" x2="45" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="50" y1="45" x2="50" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="55" y1="45" x2="55" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="58" y1="45" x2="58" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="61" y1="46" x2="61" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="64" y1="46" x2="64" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="67" y1="47" x2="67" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="70" y1="48" x2="70" y2="57" stroke="${c}" stroke-width="0.6"/><line x1="73" y1="50" x2="73" y2="57" stroke="${c}" stroke-width="0.6"/>
      <line x1="76" y1="51" x2="76" y2="57" stroke="${c}" stroke-width="0.6"/>
    </g>
  `, '0 0 100 100'),

  moustache_handlebar: (c) => svgWrap(`
    <defs>
      <linearGradient id="hbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.65"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="hbc"><path d="M8,50 C8,38 18,34 30,40 C38,44 44,49 50,49 C56,49 62,44 70,40 C82,34 92,38 92,50 C90,57 82,56 74,51 C66,46 58,50 50,50.5 C42,50 34,46 26,51 C18,56 10,57 8,50Z"/></clipPath>
    </defs>
    <path d="M8,50 C8,38 18,34 30,40 C38,44 44,49 50,49 C56,49 62,44 70,40 C82,34 92,38 92,50 C90,57 82,56 74,51 C66,46 58,50 50,50.5 C42,50 34,46 26,51 C18,56 10,57 8,50Z" fill="url(#hbg)"/>
    <g clip-path="url(#hbc)" opacity="0.55">
      <path d="M12,48 C14,42 20,38 28,41" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M16,50 C18,44 24,40 32,43" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M20,51 C22,46 28,43 36,45" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M26,50 C28,47 34,45 40,47" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M34,49 C36,47 42,47 48,49" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M52,49 C58,47 64,47 66,49" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M60,50 C64,47 70,45 74,47" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M70,50 C72,45 78,43 82,46" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M78,51 C80,46 84,43 88,46" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
    </g>
    <path d="M8,50 C4,46 2,40 6,37 C10,34 14,39 16,46" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M92,50 C96,46 98,40 94,37 C90,34 86,39 84,46" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>
  `, '0 0 100 100'),

  moustache_walrus: (c) => svgWrap(`
    <defs>
      <linearGradient id="wlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="wlc"><path d="M14,46 C20,40 34,37 50,38 C66,37 80,40 86,46 C84,57 80,65 72,69 C66,65 58,61 50,63 C42,61 34,65 28,69 C20,65 16,57 14,46Z"/></clipPath>
    </defs>
    <path d="M14,46 C20,40 34,37 50,38 C66,37 80,40 86,46 C84,57 80,65 72,69 C66,65 58,61 50,63 C42,61 34,65 28,69 C20,65 16,57 14,46Z" fill="url(#wlg)"/>
    <g clip-path="url(#wlc)" opacity="0.5">
      <line x1="20" y1="44" x2="22" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="24" y1="41" x2="26" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="28" y1="39" x2="30" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="32" y1="38" x2="34" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="36" y1="37" x2="38" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="40" y1="37" x2="42" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="44" y1="37" x2="46" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="50" y1="38" x2="50" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="54" y1="37" x2="54" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="58" y1="37" x2="58" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="62" y1="38" x2="62" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="66" y1="38" x2="66" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="70" y1="39" x2="70" y2="68" stroke="${c}" stroke-width="0.65"/><line x1="74" y1="41" x2="74" y2="68" stroke="${c}" stroke-width="0.65"/>
      <line x1="78" y1="44" x2="78" y2="68" stroke="${c}" stroke-width="0.65"/>
    </g>
  `, '0 0 100 100'),

  moustache_chevron: (c) => svgWrap(`
    <defs>
      <linearGradient id="chvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="chvc"><path d="M16,44 C26,37 38,35 50,37 C62,35 74,37 84,44 C80,55 68,57 50,55 C32,57 20,55 16,44Z"/></clipPath>
    </defs>
    <path d="M16,44 C26,37 38,35 50,37 C62,35 74,37 84,44 C80,55 68,57 50,55 C32,57 20,55 16,44Z" fill="url(#chvg)"/>
    <g clip-path="url(#chvc)" opacity="0.5">
      <line x1="20" y1="44" x2="21" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="24" y1="42" x2="25" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="28" y1="40" x2="29" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="32" y1="38" x2="33" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="36" y1="37" x2="37" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="40" y1="36" x2="41" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="44" y1="36" x2="45" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="50" y1="36" x2="50" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="56" y1="36" x2="56" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="60" y1="36" x2="60" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="64" y1="37" x2="64" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="68" y1="38" x2="68" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="72" y1="40" x2="72" y2="55" stroke="${c}" stroke-width="0.65"/><line x1="76" y1="42" x2="76" y2="55" stroke="${c}" stroke-width="0.65"/>
      <line x1="80" y1="44" x2="80" y2="55" stroke="${c}" stroke-width="0.65"/>
    </g>
  `, '0 0 100 100'),

  moustache_fu_manchu: (c) => svgWrap(`
    <defs>
      <linearGradient id="fmg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}"/></linearGradient>
    </defs>
    <path d="M26,44 C35,38 43,37 50,39 C57,37 65,38 74,44 C70,53 63,53 57,50 C54,48 52,49 50,50 C48,49 46,48 43,50 C37,53 30,53 26,44Z" fill="url(#fmg2)"/>
    <path d="M30,51 C29,58 27,66 25,76 C23,83 21,89 23,92 C25,94 28,90 29,84 C31,74 34,62 37,54" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M30,51 C29,59 28,67 27,76 C26,81 25,87 27,90" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    <path d="M70,51 C71,58 73,66 75,76 C77,83 79,89 77,92 C75,94 72,90 71,84 C69,74 66,62 63,54" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M70,51 C71,59 72,67 73,76 C74,81 75,87 73,90" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  `, '0 0 100 100'),

  moustache_english: (c) => svgWrap(`
    <defs>
      <linearGradient id="eng2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.65"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="engc"><path d="M18,50 C22,43 30,40 38,44 C43,47 47,50 50,50.5 C53,50 57,47 62,44 C70,40 78,43 82,50 C80,56 74,56 68,54 C62,52 56,51 50,52 C44,51 38,52 32,54 C26,56 20,56 18,50Z"/></clipPath>
    </defs>
    <path d="M18,50 C22,43 30,40 38,44 C43,47 47,50 50,50.5 C53,50 57,47 62,44 C70,40 78,43 82,50 C80,56 74,56 68,54 C62,52 56,51 50,52 C44,51 38,52 32,54 C26,56 20,56 18,50Z" fill="url(#eng2)"/>
    <g clip-path="url(#engc)" opacity="0.55">
      <path d="M22,50 C24,46 28,43 34,44" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M26,51 C28,47 32,44 38,45" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M30,52 C32,48 36,46 42,47" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M36,52 C38,49 42,48 46,49" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M54,49 C56,48 60,49 64,52" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M60,51 C62,48 66,47 70,49" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M66,52 C68,48 72,46 76,48" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M72,51 C74,47 78,45 80,48" fill="none" stroke="${c}" stroke-width="0.7" stroke-linecap="round"/>
    </g>
    <path d="M18,50 C13,47 6,43 4,47 C2,51 6,55 13,53 Z" fill="${c}"/>
    <path d="M82,50 C87,47 94,43 96,47 C98,51 94,55 87,53 Z" fill="${c}"/>
    <path d="M4,47 C4,43 7,41 10,43" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M96,47 C96,43 93,41 90,43" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
  `, '0 0 100 100'),

  moustache_imperial: (c) => svgWrap(`
    <defs>
      <linearGradient id="impg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}"/></linearGradient>
    </defs>
    <path d="M24,49 C32,40 41,38 50,40 C59,38 68,40 76,49 C70,57 62,56 56,53 C53,51 51,51.5 50,52 C49,51.5 47,51 44,53 C38,56 30,57 24,49Z" fill="url(#impg2)"/>
    <path d="M24,49 C18,43 12,33 16,26 C20,21 27,29 29,40" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M24,49 C19,44 14,35 18,28" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
    <path d="M76,49 C82,43 88,33 84,26 C80,21 73,29 71,40" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M76,49 C81,44 86,35 82,28" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
    <path d="M16,26 C14,22 16,19 19,21" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <path d="M84,26 C86,22 84,19 81,21" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
  `, '0 0 100 100'),

  // Beards
  beard_short: (c) => svgWrap(`
    <defs>
      <linearGradient id="bsg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="bsc"><path d="M19,53 C18,63 19,73 24,80 C32,89 42,91 50,91 C58,91 68,89 76,80 C81,73 82,63 81,53 C72,57 62,59 50,59 C38,59 28,57 19,53Z"/></clipPath>
    </defs>
    <path d="M19,53 C18,63 19,73 24,80 C32,89 42,91 50,91 C58,91 68,89 76,80 C81,73 82,63 81,53 C72,57 62,59 50,59 C38,59 28,57 19,53Z" fill="url(#bsg2)"/>
    <g clip-path="url(#bsc)" opacity="0.45">
      <line x1="22" y1="56" x2="22" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="26" y1="55" x2="26" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="30" y1="55" x2="30" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="34" y1="55" x2="34" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="38" y1="55" x2="38" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="42" y1="55" x2="42" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="46" y1="55" x2="46" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="50" y1="55" x2="50" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="54" y1="55" x2="54" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="58" y1="55" x2="58" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="62" y1="55" x2="62" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="66" y1="55" x2="66" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="70" y1="55" x2="70" y2="90" stroke="${c}" stroke-width="0.7"/><line x1="74" y1="56" x2="74" y2="90" stroke="${c}" stroke-width="0.7"/>
      <line x1="78" y1="57" x2="78" y2="90" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  beard_full: (c) => svgWrap(`
    <defs>
      <linearGradient id="bfg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.75"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="bfc"><path d="M17,49 C14,62 14,76 18,85 C26,97 38,101 50,101 C62,101 74,97 82,85 C86,76 86,62 83,49 C74,55 62,57.5 50,57.5 C38,57.5 26,55 17,49Z"/></clipPath>
    </defs>
    <path d="M17,49 C14,62 14,76 18,85 C26,97 38,101 50,101 C62,101 74,97 82,85 C86,76 86,62 83,49 C74,55 62,57.5 50,57.5 C38,57.5 26,55 17,49Z" fill="url(#bfg2)"/>
    <g clip-path="url(#bfc)" opacity="0.45">
      <line x1="20" y1="52" x2="20" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="24" y1="51" x2="24" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="28" y1="51" x2="28" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="32" y1="50" x2="32" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="36" y1="50" x2="36" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="40" y1="50" x2="40" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="44" y1="50" x2="44" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="48" y1="50" x2="48" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="52" y1="50" x2="52" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="56" y1="50" x2="56" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="60" y1="50" x2="60" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="64" y1="50" x2="64" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="68" y1="51" x2="68" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="72" y1="51" x2="72" y2="100" stroke="${c}" stroke-width="0.7"/>
      <line x1="76" y1="52" x2="76" y2="100" stroke="${c}" stroke-width="0.7"/><line x1="80" y1="53" x2="80" y2="100" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  beard_goatee: (c) => svgWrap(`
    <defs>
      <linearGradient id="gtg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.75"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="gtc"><path d="M35,49 C37,44 43,42 50,43 C57,42 63,44 65,49 C64,59 60,67 50,73 C40,67 36,59 35,49Z"/></clipPath>
    </defs>
    <path d="M35,49 C37,44 43,42 50,43 C57,42 63,44 65,49 C64,59 60,67 50,73 C40,67 36,59 35,49Z" fill="url(#gtg)"/>
    <g clip-path="url(#gtc)" opacity="0.5">
      <line x1="37" y1="50" x2="37" y2="72" stroke="${c}" stroke-width="0.7"/><line x1="40" y1="48" x2="40" y2="72" stroke="${c}" stroke-width="0.7"/>
      <line x1="43" y1="46" x2="43" y2="72" stroke="${c}" stroke-width="0.7"/><line x1="46" y1="45" x2="46" y2="72" stroke="${c}" stroke-width="0.7"/>
      <line x1="50" y1="44" x2="50" y2="72" stroke="${c}" stroke-width="0.7"/><line x1="54" y1="45" x2="54" y2="72" stroke="${c}" stroke-width="0.7"/>
      <line x1="57" y1="46" x2="57" y2="72" stroke="${c}" stroke-width="0.7"/><line x1="60" y1="48" x2="60" y2="72" stroke="${c}" stroke-width="0.7"/>
      <line x1="63" y1="50" x2="63" y2="72" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  beard_circle: (c) => svgWrap(`
    <defs>
      <linearGradient id="crcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="crcc"><path d="M29,47 C31,40 38,36 50,36 C62,36 69,40 71,47 C70,57 66,65 60,69 C56,71 53,72 50,72 C47,72 44,71 40,69 C34,65 30,57 29,47Z M39,52 C39,58 44,63 50,63 C56,63 61,58 61,52 C61,48 56,48 50,48 C44,48 39,48 39,52Z" fill-rule="evenodd"/></clipPath>
    </defs>
    <path d="M29,47 C31,40 38,36 50,36 C62,36 69,40 71,47 C70,57 66,65 60,69 C56,71 53,72 50,72 C47,72 44,71 40,69 C34,65 30,57 29,47Z M39,52 C39,58 44,63 50,63 C56,63 61,58 61,52 C61,48 56,48 50,48 C44,48 39,48 39,52Z" fill="url(#crcg)" fill-rule="evenodd"/>
    <g clip-path="url(#crcc)" opacity="0.45">
      <line x1="32" y1="48" x2="32" y2="71" stroke="${c}" stroke-width="0.7"/><line x1="36" y1="44" x2="36" y2="71" stroke="${c}" stroke-width="0.7"/>
      <line x1="40" y1="41" x2="40" y2="71" stroke="${c}" stroke-width="0.7"/><line x1="44" y1="39" x2="44" y2="71" stroke="${c}" stroke-width="0.7"/>
      <line x1="50" y1="38" x2="50" y2="71" stroke="${c}" stroke-width="0.7"/><line x1="56" y1="39" x2="56" y2="71" stroke="${c}" stroke-width="0.7"/>
      <line x1="60" y1="41" x2="60" y2="71" stroke="${c}" stroke-width="0.7"/><line x1="64" y1="44" x2="64" y2="71" stroke="${c}" stroke-width="0.7"/>
      <line x1="68" y1="48" x2="68" y2="71" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  beard_viking: (c) => svgWrap(`
    <defs>
      <linearGradient id="vkg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="vkc"><path d="M13,45 C10,61 10,77 15,89 C24,103 38,109 50,109 C62,109 76,103 85,89 C90,77 90,61 87,45 C76,53 62,57 50,57 C38,57 24,53 13,45Z"/></clipPath>
    </defs>
    <path d="M13,45 C10,61 10,77 15,89 C24,103 38,109 50,109 C62,109 76,103 85,89 C90,77 90,61 87,45 C76,53 62,57 50,57 C38,57 24,53 13,45Z" fill="url(#vkg2)"/>
    <g clip-path="url(#vkc)" opacity="0.4">
      <line x1="16" y1="50" x2="18" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="21" y1="48" x2="23" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="26" y1="46" x2="28" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="31" y1="45" x2="33" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="36" y1="45" x2="38" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="41" y1="45" x2="43" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="46" y1="45" x2="48" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="50" y1="45" x2="50" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="54" y1="45" x2="54" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="58" y1="45" x2="58" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="62" y1="45" x2="62" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="67" y1="45" x2="67" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="72" y1="46" x2="72" y2="108" stroke="${c}" stroke-width="0.8"/><line x1="77" y1="48" x2="77" y2="108" stroke="${c}" stroke-width="0.8"/>
      <line x1="82" y1="50" x2="82" y2="108" stroke="${c}" stroke-width="0.8"/>
    </g>
    <path d="M20,85 C18,94 17,103 19,109 C21,114 25,110 26,102 C27,93 25,84 23,80Z" fill="${c}"/>
    <path d="M80,85 C82,94 83,103 81,109 C79,114 75,110 74,102 C73,93 75,84 77,80Z" fill="${c}"/>
  `, '0 0 100 120'),

  beard_stubble: (c) => svgWrap(`
    <defs><filter id="stubf2"><feGaussianBlur stdDeviation="0.5"/></filter></defs>
    <ellipse cx="50" cy="65" rx="32" ry="18" fill="${c}" opacity="0.12" filter="url(#stubf2)"/>
    ${Array.from({length: 8}, (_, row) => Array.from({length: 15}, (_, col) => {
      const x = 20 + col * 4 + (row % 2) * 2;
      const y = 51 + row * 3.8;
      const len = 1.6 + ((col * 3 + row * 7) % 5) * 0.3;
      const angle = -90 + ((col + row * 3) % 7) * 5 - 15;
      const rad = angle * Math.PI / 180;
      const x2 = x + Math.cos(rad) * len;
      const y2 = y + Math.sin(rad) * len;
      const op = 0.5 + ((col + row) % 4) * 0.1;
      return `<line x1="${x}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="0.9" stroke-linecap="round" opacity="${op}"/>`;
    }).join('')).join('')}
  `, '0 0 100 100'),

  beard_mutton_chops: (c) => svgWrap(`
    <defs>
      <linearGradient id="mcg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient>
      <linearGradient id="mcg4" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient>
      <clipPath id="mccL"><path d="M13,40 C9,49 9,61 11,71 C13,79 19,83 26,81 C32,78 36,69 37,58 C38,47 34,40 28,37 C20,34 15,36 13,40Z"/></clipPath>
      <clipPath id="mccR"><path d="M87,40 C91,49 91,61 89,71 C87,79 81,83 74,81 C68,78 64,69 63,58 C62,47 66,40 72,37 C80,34 85,36 87,40Z"/></clipPath>
    </defs>
    <path d="M13,40 C9,49 9,61 11,71 C13,79 19,83 26,81 C32,78 36,69 37,58 C38,47 34,40 28,37 C20,34 15,36 13,40Z" fill="url(#mcg3)"/>
    <path d="M87,40 C91,49 91,61 89,71 C87,79 81,83 74,81 C68,78 64,69 63,58 C62,47 66,40 72,37 C80,34 85,36 87,40Z" fill="url(#mcg4)"/>
    <g clip-path="url(#mccL)" opacity="0.45">
      <line x1="14" y1="42" x2="36" y2="80" stroke="${c}" stroke-width="0.7"/><line x1="17" y1="40" x2="37" y2="75" stroke="${c}" stroke-width="0.7"/>
      <line x1="20" y1="38" x2="36" y2="70" stroke="${c}" stroke-width="0.7"/><line x1="23" y1="37" x2="35" y2="65" stroke="${c}" stroke-width="0.7"/>
      <line x1="27" y1="37" x2="35" y2="58" stroke="${c}" stroke-width="0.7"/>
    </g>
    <g clip-path="url(#mccR)" opacity="0.45">
      <line x1="86" y1="42" x2="64" y2="80" stroke="${c}" stroke-width="0.7"/><line x1="83" y1="40" x2="63" y2="75" stroke="${c}" stroke-width="0.7"/>
      <line x1="80" y1="38" x2="64" y2="70" stroke="${c}" stroke-width="0.7"/><line x1="77" y1="37" x2="65" y2="65" stroke="${c}" stroke-width="0.7"/>
      <line x1="73" y1="37" x2="65" y2="58" stroke="${c}" stroke-width="0.7"/>
    </g>
    <path d="M37,58 C42,55 46,54 50,54 C54,54 58,55 63,58" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
  `, '0 0 100 100'),

  // Sideburns
  sideburns_short: (c) => svgWrap(`
    <defs>
      <linearGradient id="ssg3" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <linearGradient id="ssg4" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="ssLc"><path d="M13,28 C9,37 9,48 11,56 C13,62 17,63 22,61 C27,58 28,49 26,38 C24,27 18,23 13,28Z"/></clipPath>
      <clipPath id="ssRc"><path d="M87,28 C91,37 91,48 89,56 C87,62 83,63 78,61 C73,58 72,49 74,38 C76,27 82,23 87,28Z"/></clipPath>
    </defs>
    <path d="M13,28 C9,37 9,48 11,56 C13,62 17,63 22,61 C27,58 28,49 26,38 C24,27 18,23 13,28Z" fill="url(#ssg3)"/>
    <path d="M87,28 C91,37 91,48 89,56 C87,62 83,63 78,61 C73,58 72,49 74,38 C76,27 82,23 87,28Z" fill="url(#ssg4)"/>
    <g clip-path="url(#ssLc)" opacity="0.5">
      <line x1="14" y1="30" x2="26" y2="62" stroke="${c}" stroke-width="0.7"/><line x1="17" y1="27" x2="27" y2="62" stroke="${c}" stroke-width="0.7"/>
      <line x1="20" y1="26" x2="27" y2="60" stroke="${c}" stroke-width="0.7"/><line x1="23" y1="27" x2="27" y2="58" stroke="${c}" stroke-width="0.7"/>
    </g>
    <g clip-path="url(#ssRc)" opacity="0.5">
      <line x1="86" y1="30" x2="74" y2="62" stroke="${c}" stroke-width="0.7"/><line x1="83" y1="27" x2="73" y2="62" stroke="${c}" stroke-width="0.7"/>
      <line x1="80" y1="26" x2="73" y2="60" stroke="${c}" stroke-width="0.7"/><line x1="77" y1="27" x2="73" y2="58" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  sideburns_long: (c) => svgWrap(`
    <defs>
      <linearGradient id="slg3" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <linearGradient id="slg4" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="slLc"><path d="M11,26 C7,39 7,55 9,67 C11,77 16,81 22,79 C28,75 29,61 28,44 C27,29 22,19 16,21 C12,21 11,23 11,26Z"/></clipPath>
      <clipPath id="slRc"><path d="M89,26 C93,39 93,55 91,67 C89,77 84,81 78,79 C72,75 71,61 72,44 C73,29 78,19 84,21 C88,21 89,23 89,26Z"/></clipPath>
    </defs>
    <path d="M11,26 C7,39 7,55 9,67 C11,77 16,81 22,79 C28,75 29,61 28,44 C27,29 22,19 16,21 C12,21 11,23 11,26Z" fill="url(#slg3)"/>
    <path d="M89,26 C93,39 93,55 91,67 C89,77 84,81 78,79 C72,75 71,61 72,44 C73,29 78,19 84,21 C88,21 89,23 89,26Z" fill="url(#slg4)"/>
    <g clip-path="url(#slLc)" opacity="0.5">
      <line x1="12" y1="27" x2="27" y2="79" stroke="${c}" stroke-width="0.7"/><line x1="15" y1="24" x2="28" y2="79" stroke="${c}" stroke-width="0.7"/>
      <line x1="18" y1="22" x2="28" y2="78" stroke="${c}" stroke-width="0.7"/><line x1="21" y1="22" x2="28" y2="75" stroke="${c}" stroke-width="0.7"/>
      <line x1="24" y1="23" x2="28" y2="70" stroke="${c}" stroke-width="0.7"/>
    </g>
    <g clip-path="url(#slRc)" opacity="0.5">
      <line x1="88" y1="27" x2="73" y2="79" stroke="${c}" stroke-width="0.7"/><line x1="85" y1="24" x2="72" y2="79" stroke="${c}" stroke-width="0.7"/>
      <line x1="82" y1="22" x2="72" y2="78" stroke="${c}" stroke-width="0.7"/><line x1="79" y1="22" x2="72" y2="75" stroke="${c}" stroke-width="0.7"/>
      <line x1="76" y1="23" x2="72" y2="70" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),

  sideburns_chops: (c) => svgWrap(`
    <defs>
      <linearGradient id="scg3" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <linearGradient id="scg4" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}"/></linearGradient>
      <clipPath id="scLc"><path d="M9,26 C5,41 5,59 7,71 C9,81 16,85 24,81 C30,77 32,65 31,48 C30,33 24,19 17,21 C12,21 9,23 9,26Z"/></clipPath>
      <clipPath id="scRc"><path d="M91,26 C95,41 95,59 93,71 C91,81 84,85 76,81 C70,77 68,65 69,48 C70,33 76,19 83,21 C88,21 91,23 91,26Z"/></clipPath>
    </defs>
    <path d="M9,26 C5,41 5,59 7,71 C9,81 16,85 24,81 C30,77 32,65 31,48 C30,33 24,19 17,21 C12,21 9,23 9,26Z" fill="url(#scg3)"/>
    <path d="M91,26 C95,41 95,59 93,71 C91,81 84,85 76,81 C70,77 68,65 69,48 C70,33 76,19 83,21 C88,21 91,23 91,26Z" fill="url(#scg4)"/>
    <g clip-path="url(#scLc)" opacity="0.5">
      <line x1="10" y1="28" x2="30" y2="82" stroke="${c}" stroke-width="0.7"/><line x1="13" y1="25" x2="31" y2="82" stroke="${c}" stroke-width="0.7"/>
      <line x1="16" y1="23" x2="31" y2="82" stroke="${c}" stroke-width="0.7"/><line x1="19" y1="22" x2="31" y2="80" stroke="${c}" stroke-width="0.7"/>
      <line x1="22" y1="22" x2="31" y2="76" stroke="${c}" stroke-width="0.7"/><line x1="26" y1="23" x2="31" y2="68" stroke="${c}" stroke-width="0.7"/>
    </g>
    <g clip-path="url(#scRc)" opacity="0.5">
      <line x1="90" y1="28" x2="70" y2="82" stroke="${c}" stroke-width="0.7"/><line x1="87" y1="25" x2="69" y2="82" stroke="${c}" stroke-width="0.7"/>
      <line x1="84" y1="23" x2="69" y2="82" stroke="${c}" stroke-width="0.7"/><line x1="81" y1="22" x2="69" y2="80" stroke="${c}" stroke-width="0.7"/>
      <line x1="78" y1="22" x2="69" y2="76" stroke="${c}" stroke-width="0.7"/><line x1="74" y1="23" x2="69" y2="68" stroke="${c}" stroke-width="0.7"/>
    </g>
  `, '0 0 100 100'),
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
      { id: 'mou_pencil',    label: 'Pencil',        svgFn: facialHairSVGs.moustache_pencil },
      { id: 'mou_handlebar', label: 'Handlebar',     svgFn: facialHairSVGs.moustache_handlebar },
      { id: 'mou_walrus',    label: 'Walrus',        svgFn: facialHairSVGs.moustache_walrus },
      { id: 'mou_chevron',   label: 'Chevron',       svgFn: facialHairSVGs.moustache_chevron },
      { id: 'mou_fumanchu',  label: 'Fu Manchu',     svgFn: facialHairSVGs.moustache_fu_manchu },
      { id: 'mou_english',   label: 'English',       svgFn: facialHairSVGs.moustache_english },
      { id: 'mou_imperial',  label: 'Imperial',      svgFn: facialHairSVGs.moustache_imperial },
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