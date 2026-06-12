// All stickers use inline SVG rendered to a data URL so they are:
// - fully transparent PNGs (no background)
// - crisp at any size
// - no external CDN needed
//
// Each sticker: { id, label, svg (JSX string), defaultX, defaultY, defaultSize }
// defaultX/Y are 0-1 fractions of the container; defaultSize is fraction of container width.

const S = (paths) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}</svg>`;

export const CATEGORIES = [
  // ─── HATS ───────────────────────────────────────────────────────────────────
  {
    id: 'hats',
    label: 'Hats',
    icon: '🎩',
    items: [
      {
        id: 'tophat',
        label: 'Top Hat',
        defaultX: 0.5, defaultY: 0.12, defaultSize: 0.42,
        svg: S(`<rect x="25" y="30" width="50" height="45" rx="3" fill="#1a1a1a"/>
               <rect x="10" y="72" width="80" height="12" rx="4" fill="#1a1a1a"/>
               <rect x="25" y="30" width="50" height="8" rx="2" fill="#333"/>
               <rect x="28" y="55" width="44" height="4" rx="2" fill="#444"/>`),
      },
      {
        id: 'cowboy',
        label: 'Cowboy Hat',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.5,
        svg: S(`<ellipse cx="50" cy="75" rx="45" ry="10" fill="#8B6914"/>
               <path d="M20 70 Q30 30 50 25 Q70 30 80 70 Z" fill="#A0772A"/>
               <ellipse cx="50" cy="70" rx="40" ry="8" fill="#8B6914"/>
               <path d="M10 72 Q50 82 90 72" stroke="#6B4F10" stroke-width="3" fill="none"/>
               <rect x="30" y="60" width="40" height="5" rx="2" fill="#6B4F10"/>`),
      },
      {
        id: 'crown',
        label: 'Crown',
        defaultX: 0.5, defaultY: 0.06, defaultSize: 0.42,
        svg: S(`<polygon points="10,70 10,35 25,50 50,20 75,50 90,35 90,70" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
               <rect x="10" y="68" width="80" height="12" rx="3" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
               <circle cx="50" cy="22" r="5" fill="#E74C3C"/>
               <circle cx="25" cy="52" r="4" fill="#3498DB"/>
               <circle cx="75" cy="52" r="4" fill="#2ECC71"/>
               <circle cx="20" cy="74" r="3" fill="#E74C3C"/>
               <circle cx="50" cy="74" r="3" fill="#3498DB"/>
               <circle cx="80" cy="74" r="3" fill="#2ECC71"/>`),
      },
      {
        id: 'beanie',
        label: 'Beanie',
        defaultX: 0.5, defaultY: 0.08, defaultSize: 0.45,
        svg: S(`<path d="M15 65 Q15 25 50 20 Q85 25 85 65 Z" fill="#C0392B"/>
               <rect x="12" y="62" width="76" height="14" rx="6" fill="#922B21"/>
               <circle cx="50" cy="22" r="8" fill="#E74C3C"/>
               <line x1="25" y1="28" x2="25" y2="65" stroke="#A93226" stroke-width="4"/>
               <line x1="38" y1="23" x2="38" y2="65" stroke="#A93226" stroke-width="4"/>
               <line x1="50" y1="22" x2="50" y2="65" stroke="#A93226" stroke-width="4"/>
               <line x1="62" y1="23" x2="62" y2="65" stroke="#A93226" stroke-width="4"/>
               <line x1="75" y1="28" x2="75" y2="65" stroke="#A93226" stroke-width="4"/>`),
      },
      {
        id: 'fedora',
        label: 'Fedora',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.5,
        svg: S(`<ellipse cx="50" cy="75" rx="42" ry="9" fill="#5D4037"/>
               <path d="M22 70 Q22 35 50 28 Q78 35 78 70 Z" fill="#6D4C41"/>
               <path d="M30 50 Q30 40 50 36 Q70 40 70 50" fill="#795548"/>
               <rect x="25" y="60" width="50" height="6" rx="3" fill="#4E342E"/>
               <ellipse cx="50" cy="70" rx="37" ry="7" fill="#5D4037"/>`),
      },
      {
        id: 'party_hat',
        label: 'Party Hat',
        defaultX: 0.5, defaultY: 0.05, defaultSize: 0.38,
        svg: S(`<polygon points="50,5 20,80 80,80" fill="#E91E63"/>
               <polygon points="50,5 35,42" fill="#FF69B4" opacity="0.5"/>
               <polygon points="50,5 65,42" fill="#FF1493" opacity="0.5"/>
               <line x1="50" y1="5" x2="35" y2="42" stroke="#FFD700" stroke-width="2"/>
               <line x1="50" y1="5" x2="65" y2="42" stroke="#FFD700" stroke-width="2"/>
               <circle cx="30" cy="55" r="3" fill="#FFD700"/>
               <circle cx="70" cy="55" r="3" fill="#00BCD4"/>
               <circle cx="50" cy="70" r="3" fill="#4CAF50"/>
               <circle cx="38" cy="30" r="2" fill="#FFD700"/>
               <circle cx="62" cy="30" r="2" fill="#fff"/>
               <rect x="20" y="78" width="60" height="10" rx="4" fill="#C2185B"/>
               <circle cx="50" cy="5" r="5" fill="#FFD700"/>`),
      },
      {
        id: 'santa_hat',
        label: 'Santa Hat',
        defaultX: 0.5, defaultY: 0.08, defaultSize: 0.45,
        svg: S(`<path d="M40 65 Q30 20 60 8 Q65 40 70 65 Z" fill="#C0392B"/>
               <rect x="18" y="62" width="65" height="16" rx="8" fill="white"/>
               <circle cx="60" cy="8" r="7" fill="white"/>`),
      },
      {
        id: 'wizard_hat',
        label: 'Wizard Hat',
        defaultX: 0.5, defaultY: 0.08, defaultSize: 0.48,
        svg: S(`<polygon points="50,5 20,80 80,80" fill="#4A148C"/>
               <ellipse cx="50" cy="80" rx="35" ry="8" fill="#6A1B9A"/>
               <circle cx="35" cy="45" r="4" fill="#FFD700"/>
               <circle cx="65" cy="35" r="3" fill="#FFD700"/>
               <circle cx="55" cy="60" r="3" fill="#FFD700"/>
               <circle cx="40" cy="65" r="2" fill="#FFD700"/>
               <path d="M28 78 Q50 70 72 78" stroke="#9C27B0" stroke-width="3" fill="none"/>`),
      },
      {
        id: 'hardhat',
        label: 'Hard Hat',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.48,
        svg: S(`<path d="M10 62 Q10 30 50 25 Q90 30 90 62 Z" fill="#FFC107"/>
               <rect x="8" y="60" width="84" height="12" rx="4" fill="#FFA000"/>
               <rect x="20" y="40" width="60" height="6" rx="3" fill="#FFD54F" opacity="0.6"/>
               <rect x="42" y="25" width="16" height="6" fill="#FF8F00"/>`),
      },
    ],
  },

  // ─── GLASSES / EYEWEAR ──────────────────────────────────────────────────────
  {
    id: 'eyewear',
    label: 'Eyewear',
    icon: '👓',
    items: [
      {
        id: 'classic_glasses',
        label: 'Classic',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.5,
        svg: S(`<circle cx="30" cy="50" r="18" fill="none" stroke="#1a1a1a" stroke-width="5"/>
               <circle cx="70" cy="50" r="18" fill="none" stroke="#1a1a1a" stroke-width="5"/>
               <line x1="48" y1="50" x2="52" y2="50" stroke="#1a1a1a" stroke-width="5"/>
               <line x1="5" y1="48" x2="12" y2="50" stroke="#1a1a1a" stroke-width="4"/>
               <line x1="95" y1="48" x2="88" y2="50" stroke="#1a1a1a" stroke-width="4"/>`),
      },
      {
        id: 'round_glasses',
        label: 'Round',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.5,
        svg: S(`<circle cx="30" cy="50" r="18" fill="rgba(150,210,255,0.25)" stroke="#8B4513" stroke-width="5"/>
               <circle cx="70" cy="50" r="18" fill="rgba(150,210,255,0.25)" stroke="#8B4513" stroke-width="5"/>
               <line x1="48" y1="50" x2="52" y2="50" stroke="#8B4513" stroke-width="4"/>
               <line x1="5" y1="47" x2="12" y2="50" stroke="#8B4513" stroke-width="4"/>
               <line x1="95" y1="47" x2="88" y2="50" stroke="#8B4513" stroke-width="4"/>`),
      },
      {
        id: 'sunglasses',
        label: 'Sunglasses',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.55,
        svg: S(`<rect x="8" y="38" width="36" height="24" rx="8" fill="#1a1a1a"/>
               <rect x="56" y="38" width="36" height="24" rx="8" fill="#1a1a1a"/>
               <rect x="44" y="46" width="12" height="5" rx="2" fill="#333"/>
               <line x1="8" y1="46" x2="3" y2="44" stroke="#1a1a1a" stroke-width="4"/>
               <line x1="92" y1="46" x2="97" y2="44" stroke="#1a1a1a" stroke-width="4"/>
               <rect x="8" y="38" width="36" height="8" rx="8" fill="#333" opacity="0.5"/>`),
      },
      {
        id: 'aviators',
        label: 'Aviators',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.55,
        svg: S(`<path d="M10 42 Q10 64 30 64 Q50 64 50 50 Q50 64 70 64 Q90 64 90 42 Q85 35 70 35 Q55 35 50 42 Q45 35 30 35 Q15 35 10 42Z" fill="rgba(180,140,80,0.4)" stroke="#B8860B" stroke-width="4"/>
               <line x1="3" y1="42" x2="10" y2="44" stroke="#B8860B" stroke-width="4"/>
               <line x1="97" y1="42" x2="90" y2="44" stroke="#B8860B" stroke-width="4"/>`),
      },
      {
        id: 'monocle',
        label: 'Monocle',
        defaultX: 0.58, defaultY: 0.38, defaultSize: 0.3,
        svg: S(`<circle cx="50" cy="45" r="32" fill="rgba(150,210,255,0.2)" stroke="#8B6914" stroke-width="6"/>
               <line x1="78" y1="72" x2="90" y2="90" stroke="#8B6914" stroke-width="5"/>
               <circle cx="50" cy="45" r="25" fill="none" stroke="#DAA520" stroke-width="2"/>`),
      },
      {
        id: 'cat_eye',
        label: 'Cat Eye',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.55,
        svg: S(`<path d="M8 52 L12 38 L44 36 L48 50 L44 62 L12 62 Z" fill="#E91E63" stroke="#C2185B" stroke-width="3"/>
               <path d="M52 50 L56 36 L88 38 L92 52 L88 62 L56 62 Z" fill="#E91E63" stroke="#C2185B" stroke-width="3"/>
               <line x1="44" y1="49" x2="52" y2="49" stroke="#C2185B" stroke-width="3"/>
               <line x1="3" y1="46" x2="8" y2="48" stroke="#C2185B" stroke-width="4"/>
               <line x1="97" y1="46" x2="92" y2="48" stroke="#C2185B" stroke-width="4"/>`),
      },
      {
        id: 'vr_goggles',
        label: 'VR Goggles',
        defaultX: 0.5, defaultY: 0.4, defaultSize: 0.55,
        svg: S(`<rect x="5" y="35" width="90" height="35" rx="10" fill="#212121"/>
               <rect x="8" y="38" width="38" height="26" rx="8" fill="#37474F"/>
               <rect x="54" y="38" width="38" height="26" rx="8" fill="#37474F"/>
               <circle cx="27" cy="51" r="8" fill="#00BCD4" opacity="0.6"/>
               <circle cx="73" cy="51" r="8" fill="#00BCD4" opacity="0.6"/>
               <line x1="5" y1="50" x2="0" y2="48" stroke="#212121" stroke-width="4"/>
               <line x1="95" y1="50" x2="100" y2="48" stroke="#212121" stroke-width="4"/>`),
      },
    ],
  },

  // ─── FACIAL HAIR ────────────────────────────────────────────────────────────
  {
    id: 'facial_hair',
    label: 'Facial Hair',
    icon: '🧔',
    items: [
      {
        id: 'thin_mustache',
        label: 'Thin Moustache',
        defaultX: 0.5, defaultY: 0.58, defaultSize: 0.4,
        svg: S(`<path d="M15 50 Q30 30 50 45 Q70 30 85 50 Q70 60 50 55 Q30 60 15 50Z" fill="#3E2723"/>`),
      },
      {
        id: 'handlebar',
        label: 'Handlebar',
        defaultX: 0.5, defaultY: 0.58, defaultSize: 0.5,
        svg: S(`<path d="M50 45 Q35 35 20 40 Q10 45 12 55 Q20 55 30 48 Q40 42 50 50 Q60 42 70 48 Q80 55 88 55 Q90 45 80 40 Q65 35 50 45Z" fill="#1a1a1a"/>
               <path d="M12 52 Q8 40 15 35" stroke="#1a1a1a" stroke-width="4" fill="none"/>
               <path d="M88 52 Q92 40 85 35" stroke="#1a1a1a" stroke-width="4" fill="none"/>`),
      },
      {
        id: 'full_beard',
        label: 'Full Beard',
        defaultX: 0.5, defaultY: 0.7, defaultSize: 0.55,
        svg: S(`<path d="M15 20 Q10 50 15 75 Q30 95 50 98 Q70 95 85 75 Q90 50 85 20 Q70 30 50 30 Q30 30 15 20Z" fill="#4E342E"/>
               <path d="M20 20 Q30 10 50 12 Q70 10 80 20" fill="#5D4037"/>
               <path d="M30 50 Q50 40 70 50" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
               <path d="M25 65 Q50 55 75 65" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>`),
      },
      {
        id: 'goatee',
        label: 'Goatee',
        defaultX: 0.5, defaultY: 0.68, defaultSize: 0.35,
        svg: S(`<path d="M35 15 Q30 35 32 55 Q38 75 50 80 Q62 75 68 55 Q70 35 65 15 Q55 5 50 8 Q45 5 35 15Z" fill="#333"/>
               <path d="M40 40 Q50 35 60 40" stroke="#555" stroke-width="2" fill="none"/>`),
      },
      {
        id: 'soul_patch',
        label: 'Soul Patch',
        defaultX: 0.5, defaultY: 0.66, defaultSize: 0.2,
        svg: S(`<ellipse cx="50" cy="55" rx="15" ry="22" fill="#1a1a1a"/>
               <ellipse cx="50" cy="48" rx="10" ry="8" fill="#333"/>`),
      },
      {
        id: 'viking_beard',
        label: 'Viking Beard',
        defaultX: 0.5, defaultY: 0.72, defaultSize: 0.6,
        svg: S(`<path d="M10 10 Q5 40 8 70 Q20 95 50 100 Q80 95 92 70 Q95 40 90 10 Q75 25 50 22 Q25 25 10 10Z" fill="#B8860B"/>
               <path d="M20 80 Q25 95 30 100" stroke="#8B6914" stroke-width="6" stroke-linecap="round" fill="none"/>
               <path d="M50 90 Q50 100 50 105" stroke="#8B6914" stroke-width="6" stroke-linecap="round" fill="none"/>
               <path d="M80 80 Q75 95 70 100" stroke="#8B6914" stroke-width="6" stroke-linecap="round" fill="none"/>
               <path d="M20 50 Q50 40 80 50" stroke="#DAA520" stroke-width="2" fill="none" opacity="0.5"/>`),
      },
      {
        id: 'stubble',
        label: 'Stubble',
        defaultX: 0.5, defaultY: 0.65, defaultSize: 0.55,
        svg: S(`<path d="M15 15 Q12 45 18 70 Q30 90 50 92 Q70 90 82 70 Q88 45 85 15 Q70 28 50 26 Q30 28 15 15Z" fill="none"/>
               ${Array.from({length:80}, (_,i) => `<circle cx="${15+Math.sin(i*2.1)*35+35}" cy="${18+i*0.85}" r="0.9" fill="#555" opacity="${0.3+Math.random()*0.4}"/>`).join('')}`),
      },
    ],
  },

  // ─── HAIR ───────────────────────────────────────────────────────────────────
  {
    id: 'hair',
    label: 'Hair',
    icon: '💇',
    items: [
      {
        id: 'mohawk',
        label: 'Mohawk',
        defaultX: 0.5, defaultY: 0.06, defaultSize: 0.45,
        svg: S(`<path d="M38 90 Q35 50 40 10 Q50 0 60 10 Q65 50 62 90 Z" fill="#E91E63"/>
               <path d="M40 10 Q50 5 60 10 Q55 2 50 0 Q45 2 40 10Z" fill="#F48FB1"/>`),
      },
      {
        id: 'afro',
        label: 'Afro',
        defaultX: 0.5, defaultY: 0.08, defaultSize: 0.55,
        svg: S(`<ellipse cx="50" cy="45" rx="42" ry="42" fill="#3E2723"/>
               <ellipse cx="32" cy="30" rx="18" ry="16" fill="#4E342E"/>
               <ellipse cx="68" cy="30" rx="18" ry="16" fill="#4E342E"/>
               <ellipse cx="50" cy="22" rx="20" ry="16" fill="#5D4037"/>
               <ellipse cx="50" cy="45" rx="38" ry="30" fill="#3E2723"/>`),
      },
      {
        id: 'ponytail',
        label: 'Ponytail',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.5,
        svg: S(`<path d="M15 70 Q10 30 50 20 Q90 30 85 70 Q70 80 50 80 Q30 80 15 70Z" fill="#FFD54F"/>
               <path d="M70 60 Q85 65 88 80 Q85 95 80 98 Q75 95 72 85 Q70 75 70 60Z" fill="#FFCA28"/>
               <ellipse cx="70" cy="62" rx="6" ry="4" fill="#FFA000"/>`),
      },
      {
        id: 'spiky',
        label: 'Spiky',
        defaultX: 0.5, defaultY: 0.05, defaultSize: 0.5,
        svg: S(`<path d="M20 65 Q18 40 50 30 Q82 40 80 65Z" fill="#1565C0"/>
               <polygon points="30,60 25,20 38,55" fill="#1976D2"/>
               <polygon points="50,58 48,10 58,55" fill="#1976D2"/>
               <polygon points="68,60 72,18 60,55" fill="#1976D2"/>
               <polygon points="40,59 35,30 48,56" fill="#42A5F5"/>
               <polygon points="60,59 65,28 55,56" fill="#42A5F5"/>`),
      },
      {
        id: 'buns',
        label: 'Space Buns',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.55,
        svg: S(`<path d="M20 65 Q18 35 50 28 Q82 35 80 65Z" fill="#FF7043"/>
               <circle cx="18" cy="32" r="14" fill="#FF7043"/>
               <circle cx="82" cy="32" r="14" fill="#FF7043"/>
               <circle cx="18" cy="32" r="9" fill="#FF8A65"/>
               <circle cx="82" cy="32" r="9" fill="#FF8A65"/>`),
      },
      {
        id: 'long_wavy',
        label: 'Long Wavy',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.55,
        svg: S(`<path d="M18 25 Q10 50 12 80 Q15 90 18 85 Q16 65 20 45 Q25 35 28 55 Q30 70 28 90 Q32 95 35 88 Q33 70 36 50 Q40 35 42 55 Q43 70 42 88 Q45 95 48 90 Q47 72 48 55 Q50 38 52 55 Q53 72 52 90 Q55 95 58 88 Q57 70 58 50 Q62 35 64 55 Q65 70 64 90 Q68 95 72 88 Q70 70 72 50 Q76 35 78 55 Q80 65 78 85 Q82 90 85 80 Q90 55 82 25 Q68 10 50 10 Q32 10 18 25Z" fill="#FFD700"/>`),
      },
    ],
  },

  // ─── BOW TIES & NECKWEAR ─────────────────────────────────────────────────────
  {
    id: 'neckwear',
    label: 'Neckwear',
    icon: '🎀',
    items: [
      {
        id: 'bowtie_black',
        label: 'Black Bow Tie',
        defaultX: 0.5, defaultY: 0.82, defaultSize: 0.4,
        svg: S(`<polygon points="50,40 15,20 15,60" fill="#1a1a1a"/>
               <polygon points="50,40 85,20 85,60" fill="#1a1a1a"/>
               <ellipse cx="50" cy="40" rx="8" ry="8" fill="#333"/>
               <polygon points="50,40 15,20 15,60" fill="none" stroke="#333" stroke-width="1"/>
               <polygon points="50,40 85,20 85,60" fill="none" stroke="#333" stroke-width="1"/>`),
      },
      {
        id: 'bowtie_red',
        label: 'Red Bow Tie',
        defaultX: 0.5, defaultY: 0.82, defaultSize: 0.4,
        svg: S(`<polygon points="50,40 15,20 15,60" fill="#C0392B"/>
               <polygon points="50,40 85,20 85,60" fill="#C0392B"/>
               <ellipse cx="50" cy="40" rx="8" ry="8" fill="#E74C3C"/>
               <polygon points="50,40 15,20 15,60" fill="none" stroke="#922B21" stroke-width="1"/>
               <polygon points="50,40 85,20 85,60" fill="none" stroke="#922B21" stroke-width="1"/>`),
      },
      {
        id: 'bowtie_polka',
        label: 'Polka Bow Tie',
        defaultX: 0.5, defaultY: 0.82, defaultSize: 0.4,
        svg: S(`<polygon points="50,40 15,20 15,60" fill="#2980B9"/>
               <polygon points="50,40 85,20 85,60" fill="#2980B9"/>
               <ellipse cx="50" cy="40" rx="8" ry="8" fill="#3498DB"/>
               <circle cx="25" cy="35" r="3" fill="white" opacity="0.7"/>
               <circle cx="30" cy="50" r="3" fill="white" opacity="0.7"/>
               <circle cx="20" cy="48" r="2" fill="white" opacity="0.7"/>
               <circle cx="70" cy="35" r="3" fill="white" opacity="0.7"/>
               <circle cx="75" cy="50" r="3" fill="white" opacity="0.7"/>
               <circle cx="80" cy="42" r="2" fill="white" opacity="0.7"/>`),
      },
      {
        id: 'necktie',
        label: 'Neck Tie',
        defaultX: 0.5, defaultY: 0.88, defaultSize: 0.28,
        svg: S(`<polygon points="50,5 38,25 42,85 50,95 58,85 62,25" fill="#C0392B"/>
               <polygon points="50,5 38,25 50,28 62,25" fill="#E74C3C"/>
               <line x1="44" y1="40" x2="56" y2="40" stroke="#922B21" stroke-width="2"/>
               <line x1="43" y1="55" x2="57" y2="55" stroke="#922B21" stroke-width="2"/>
               <line x1="43" y1="70" x2="57" y2="70" stroke="#922B21" stroke-width="2"/>`),
      },
      {
        id: 'ruffle',
        label: 'Ruffle Collar',
        defaultX: 0.5, defaultY: 0.82, defaultSize: 0.55,
        svg: S(`<ellipse cx="50" cy="55" rx="45" ry="20" fill="white" stroke="#ddd" stroke-width="2"/>
               <path d="M10 52 Q20 38 30 52 Q40 38 50 52 Q60 38 70 52 Q80 38 90 52" fill="none" stroke="#ccc" stroke-width="3"/>
               <path d="M10 58 Q20 70 30 58 Q40 70 50 58 Q60 70 70 58 Q80 70 90 58" fill="none" stroke="#ccc" stroke-width="3"/>
               <ellipse cx="50" cy="40" rx="12" ry="8" fill="white" stroke="#ddd" stroke-width="2"/>`),
      },
      {
        id: 'scarf',
        label: 'Scarf',
        defaultX: 0.5, defaultY: 0.82, defaultSize: 0.6,
        svg: S(`<path d="M15 35 Q30 25 50 30 Q70 25 85 35 Q80 55 85 65 Q70 60 65 75 Q60 65 50 60 Q40 65 35 75 Q30 60 15 65 Q20 55 15 35Z" fill="#E53935"/>
               <line x1="20" y1="40" x2="80" y2="40" stroke="#C62828" stroke-width="2" opacity="0.5"/>
               <line x1="20" y1="50" x2="80" y2="50" stroke="#C62828" stroke-width="2" opacity="0.5"/>
               <rect x="62" y="55" width="12" height="35" rx="4" fill="#EF5350"/>
               <rect x="28" y="55" width="12" height="35" rx="4" fill="#EF5350"/>
               <line x1="63" y1="65" x2="73" y2="65" stroke="#C62828" stroke-width="2"/>
               <line x1="63" y1="72" x2="73" y2="72" stroke="#C62828" stroke-width="2"/>
               <line x1="29" y1="65" x2="39" y2="65" stroke="#C62828" stroke-width="2"/>
               <line x1="29" y1="72" x2="39" y2="72" stroke="#C62828" stroke-width="2"/>`),
      },
    ],
  },

  // ─── JEWELRY ─────────────────────────────────────────────────────────────────
  {
    id: 'jewelry',
    label: 'Jewelry',
    icon: '💍',
    items: [
      {
        id: 'gold_chain',
        label: 'Gold Chain',
        defaultX: 0.5, defaultY: 0.8, defaultSize: 0.55,
        svg: S(`<path d="M15 25 Q10 50 15 70 Q30 85 50 88 Q70 85 85 70 Q90 50 85 25" fill="none" stroke="#FFD700" stroke-width="6" stroke-dasharray="8,4"/>
               <circle cx="50" cy="88" r="8" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
               <polygon points="50,82 44,96 56,96" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
               <circle cx="50" cy="96" r="3" fill="#FFB300"/>`),
      },
      {
        id: 'diamond_necklace',
        label: 'Diamond Necklace',
        defaultX: 0.5, defaultY: 0.8, defaultSize: 0.55,
        svg: S(`<path d="M15 20 Q10 50 15 70 Q30 85 50 88 Q70 85 85 70 Q90 50 85 20" fill="none" stroke="#E0E0E0" stroke-width="3"/>
               <circle cx="50" cy="88" r="4" fill="#B0BEC5"/>
               <polygon points="50,90 43,105 57,105" fill="#64B5F6" stroke="#1565C0" stroke-width="1"/>
               <polygon points="50,103 46,112 54,112" fill="#42A5F5"/>
               <circle cx="25" cy="48" r="3" fill="#64B5F6"/>
               <circle cx="35" cy="72" r="3" fill="#64B5F6"/>
               <circle cx="65" cy="72" r="3" fill="#64B5F6"/>
               <circle cx="75" cy="48" r="3" fill="#64B5F6"/>`),
      },
      {
        id: 'hoop_earrings',
        label: 'Hoop Earrings',
        defaultX: 0.5, defaultY: 0.48, defaultSize: 0.55,
        svg: S(`<circle cx="8" cy="50" r="12" fill="none" stroke="#FFD700" stroke-width="5"/>
               <circle cx="92" cy="50" r="12" fill="none" stroke="#FFD700" stroke-width="5"/>
               <rect x="4" y="36" width="8" height="8" rx="2" fill="#FFD700"/>`),
      },
      {
        id: 'stud_earrings',
        label: 'Stud Earrings',
        defaultX: 0.5, defaultY: 0.46, defaultSize: 0.55,
        svg: S(`<circle cx="8" cy="48" r="7" fill="#E91E63"/>
               <circle cx="92" cy="48" r="7" fill="#E91E63"/>
               <circle cx="8" cy="48" r="4" fill="#F48FB1"/>
               <circle cx="92" cy="48" r="4" fill="#F48FB1"/>`),
      },
      {
        id: 'pearl_necklace',
        label: 'Pearls',
        defaultX: 0.5, defaultY: 0.8, defaultSize: 0.55,
        svg: S(`<path d="M15 30 Q10 55 15 72 Q30 88 50 90 Q70 88 85 72 Q90 55 85 30" fill="none" stroke="#F5F5F5" stroke-width="2"/>
               ${[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                  const t = i/12;
                  const x = 15 + t*70;
                  const yBase = 30 + Math.sin(t*Math.PI)*60;
                  return `<circle cx="${x}" cy="${yBase}" r="5" fill="#FAFAFA" stroke="#E0E0E0" stroke-width="1"/>`;
               }).join('')}`),
      },
      {
        id: 'nose_ring',
        label: 'Nose Ring',
        defaultX: 0.5, defaultY: 0.54, defaultSize: 0.2,
        svg: S(`<circle cx="50" cy="55" r="22" fill="none" stroke="#FFD700" stroke-width="8"/>
               <rect x="40" y="2" width="20" height="20" rx="4" fill="#F5F5F5"/>`),
      },
      {
        id: 'tiara',
        label: 'Tiara',
        defaultX: 0.5, defaultY: 0.15, defaultSize: 0.5,
        svg: S(`<path d="M10 65 Q10 55 50 40 Q90 55 90 65 Z" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
               <polygon points="50,40 44,20 56,20" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
               <polygon points="28,50 22,34 34,34" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
               <polygon points="72,50 66,34 78,34" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
               <circle cx="50" cy="20" r="5" fill="#E91E63"/>
               <circle cx="28" cy="34" r="4" fill="#64B5F6"/>
               <circle cx="72" cy="34" r="4" fill="#4CAF50"/>
               <circle cx="20" cy="58" r="3" fill="#E91E63"/>
               <circle cx="80" cy="58" r="3" fill="#E91E63"/>`),
      },
      {
        id: 'ankh',
        label: 'Ankh Pendant',
        defaultX: 0.5, defaultY: 0.85, defaultSize: 0.25,
        svg: S(`<path d="M15 30 Q10 55 15 72 Q30 88 50 90 Q70 88 85 72 Q90 55 85 30" fill="none" stroke="#FFD700" stroke-width="3"/>
               <ellipse cx="50" cy="50" rx="12" ry="16" fill="none" stroke="#FFD700" stroke-width="5"/>
               <line x1="50" y1="64" x2="50" y2="95" stroke="#FFD700" stroke-width="5"/>
               <line x1="32" y1="74" x2="68" y2="74" stroke="#FFD700" stroke-width="5"/>`),
      },
    ],
  },

  // ─── PIERCINGS ───────────────────────────────────────────────────────────────
  {
    id: 'piercings',
    label: 'Piercings',
    icon: '💎',
    items: [
      {
        id: 'lip_ring',
        label: 'Lip Ring',
        defaultX: 0.5, defaultY: 0.65, defaultSize: 0.2,
        svg: S(`<circle cx="50" cy="60" r="20" fill="none" stroke="#C0C0C0" stroke-width="7"/>
               <circle cx="50" cy="40" r="5" fill="#C0C0C0"/>`),
      },
      {
        id: 'eyebrow_bar',
        label: 'Eyebrow Bar',
        defaultX: 0.38, defaultY: 0.34, defaultSize: 0.2,
        svg: S(`<rect x="40" y="20" width="20" height="60" rx="10" fill="#C0C0C0"/>
               <circle cx="50" cy="20" r="10" fill="#E0E0E0"/>
               <circle cx="50" cy="80" r="10" fill="#E0E0E0"/>
               <circle cx="50" cy="20" r="5" fill="#64B5F6"/>
               <circle cx="50" cy="80" r="5" fill="#64B5F6"/>`),
      },
      {
        id: 'septum',
        label: 'Septum Ring',
        defaultX: 0.5, defaultY: 0.52, defaultSize: 0.22,
        svg: S(`<path d="M15 40 Q15 80 50 85 Q85 80 85 40" fill="none" stroke="#C0C0C0" stroke-width="10" stroke-linecap="round"/>
               <circle cx="15" cy="40" r="6" fill="#E0E0E0"/>
               <circle cx="85" cy="40" r="6" fill="#E0E0E0"/>`),
      },
      {
        id: 'industrial_bar',
        label: 'Industrial Bar',
        defaultX: 0.15, defaultY: 0.3, defaultSize: 0.3,
        svg: S(`<line x1="10" y1="15" x2="90" y2="85" stroke="#C0C0C0" stroke-width="8" stroke-linecap="round"/>
               <circle cx="10" cy="15" r="10" fill="#E0E0E0" stroke="#aaa" stroke-width="2"/>
               <circle cx="90" cy="85" r="10" fill="#E0E0E0" stroke="#aaa" stroke-width="2"/>
               <circle cx="10" cy="15" r="5" fill="#E91E63"/>
               <circle cx="90" cy="85" r="5" fill="#E91E63"/>`),
      },
      {
        id: 'dermal',
        label: 'Dermal Stud',
        defaultX: 0.35, defaultY: 0.42, defaultSize: 0.12,
        svg: S(`<circle cx="50" cy="50" r="35" fill="#C0C0C0" stroke="#aaa" stroke-width="5"/>
               <circle cx="50" cy="50" r="20" fill="#64B5F6"/>
               <circle cx="50" cy="50" r="10" fill="#90CAF9"/>
               <circle cx="42" cy="42" r="4" fill="white" opacity="0.7"/>`),
      },
    ],
  },

  // ─── TATTOOS ─────────────────────────────────────────────────────────────────
  {
    id: 'tattoos',
    label: 'Tattoos',
    icon: '🖋️',
    items: [
      {
        id: 'tat_anchor',
        label: 'Anchor',
        defaultX: 0.75, defaultY: 0.65, defaultSize: 0.25,
        svg: S(`<line x1="50" y1="15" x2="50" y2="90" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
               <ellipse cx="50" cy="20" rx="18" ry="10" fill="none" stroke="#1a1a1a" stroke-width="5"/>
               <line x1="15" y1="50" x2="85" y2="50" stroke="#1a1a1a" stroke-width="6"/>
               <path d="M15 75 Q15 90 30 90 Q35 82 50 90 Q65 82 70 90 Q85 90 85 75" fill="none" stroke="#1a1a1a" stroke-width="5"/>`),
      },
      {
        id: 'tat_rose',
        label: 'Rose',
        defaultX: 0.75, defaultY: 0.6, defaultSize: 0.28,
        svg: S(`<path d="M50 85 Q30 70 25 50 Q20 30 50 20 Q80 30 75 50 Q70 70 50 85Z" fill="#C0392B" stroke="#922B21" stroke-width="2"/>
               <path d="M50 20 Q42 30 40 50 Q38 70 50 85 Q62 70 60 50 Q58 30 50 20Z" fill="#E74C3C" opacity="0.6"/>
               <circle cx="50" cy="52" r="10" fill="#E74C3C"/>
               <line x1="50" y1="85" x2="50" y2="100" stroke="#27AE60" stroke-width="5"/>
               <path d="M50 92 Q38 88 32 78" fill="none" stroke="#27AE60" stroke-width="4"/>
               <ellipse cx="32" cy="78" rx="10" ry="6" fill="#27AE60" transform="rotate(-30 32 78)"/>`),
      },
      {
        id: 'tat_heart',
        label: 'Heart',
        defaultX: 0.72, defaultY: 0.62, defaultSize: 0.22,
        svg: S(`<path d="M50 80 L10 40 Q10 10 40 15 Q50 18 50 28 Q50 18 60 15 Q90 10 90 40 Z" fill="none" stroke="#C0392B" stroke-width="6" stroke-linejoin="round"/>
               <path d="M30 30 Q28 42 50 60" fill="none" stroke="#E74C3C" stroke-width="3" opacity="0.5"/>`),
      },
      {
        id: 'tat_tribal',
        label: 'Tribal',
        defaultX: 0.7, defaultY: 0.5, defaultSize: 0.3,
        svg: S(`<path d="M20 50 Q25 20 50 15 Q70 18 75 35 Q80 50 70 60 Q65 70 50 75 Q35 70 30 60 Q25 50 30 40 Q35 28 50 30 Q62 32 65 45 Q65 58 55 63 Q45 65 40 55 Q38 48 45 44 Q52 40 57 48 Q57 56 50 57" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
               <path d="M75 35 Q85 25 90 35 Q88 48 80 50" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
               <path d="M20 50 Q10 45 8 55 Q10 65 20 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>`),
      },
      {
        id: 'tat_star',
        label: 'Star',
        defaultX: 0.72, defaultY: 0.55, defaultSize: 0.22,
        svg: S(`<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"/>`),
      },
      {
        id: 'tat_infinity',
        label: 'Infinity',
        defaultX: 0.72, defaultY: 0.6, defaultSize: 0.3,
        svg: S(`<path d="M20 50 Q20 25 40 25 Q60 25 50 50 Q40 75 60 75 Q80 75 80 50 Q80 25 60 25 Q40 25 50 50 Q60 75 40 75 Q20 75 20 50Z" fill="none" stroke="#1a1a1a" stroke-width="6"/>`),
      },
      {
        id: 'tat_butterfly',
        label: 'Butterfly',
        defaultX: 0.72, defaultY: 0.55, defaultSize: 0.28,
        svg: S(`<path d="M50 50 Q30 20 10 25 Q5 45 25 55 Q40 60 50 50Z" fill="#7B1FA2" stroke="#4A148C" stroke-width="2"/>
               <path d="M50 50 Q70 20 90 25 Q95 45 75 55 Q60 60 50 50Z" fill="#7B1FA2" stroke="#4A148C" stroke-width="2"/>
               <path d="M50 50 Q35 65 20 60 Q18 75 30 78 Q45 75 50 50Z" fill="#9C27B0" stroke="#4A148C" stroke-width="2"/>
               <path d="M50 50 Q65 65 80 60 Q82 75 70 78 Q55 75 50 50Z" fill="#9C27B0" stroke="#4A148C" stroke-width="2"/>
               <line x1="50" y1="35" x2="50" y2="75" stroke="#4A148C" stroke-width="3"/>
               <path d="M50 35 Q42 20 38 10" fill="none" stroke="#4A148C" stroke-width="2"/>
               <path d="M50 35 Q58 20 62 10" fill="none" stroke="#4A148C" stroke-width="2"/>`),
      },
      {
        id: 'tat_dragon',
        label: 'Dragon',
        defaultX: 0.7, defaultY: 0.55, defaultSize: 0.35,
        svg: S(`<path d="M20 80 Q15 60 25 45 Q30 35 45 30 Q55 25 60 35 Q65 42 58 50 Q68 45 72 35 Q80 20 85 30 Q88 40 80 50 Q88 48 92 55 Q95 65 85 72 Q75 78 65 70 Q60 80 50 85 Q38 90 30 80 Q25 85 20 80Z" fill="#27AE60" stroke="#1E8449" stroke-width="2"/>
               <circle cx="48" cy="35" r="4" fill="#F39C12"/>
               <circle cx="65" cy="42" r="3" fill="#F39C12"/>
               <path d="M30 55 Q35 50 40 55 Q35 60 30 55Z" fill="#E74C3C"/>
               <path d="M55 60 Q60 55 65 60 Q60 65 55 60Z" fill="#E74C3C"/>`),
      },
    ],
  },

  // ─── FUN EFFECTS ─────────────────────────────────────────────────────────────
  {
    id: 'effects',
    label: 'Effects',
    icon: '✨',
    items: [
      {
        id: 'halo',
        label: 'Halo',
        defaultX: 0.5, defaultY: 0.06, defaultSize: 0.38,
        svg: S(`<ellipse cx="50" cy="50" rx="40" ry="12" fill="none" stroke="#FFD700" stroke-width="7"/>
               <ellipse cx="50" cy="50" rx="40" ry="12" fill="rgba(255,215,0,0.1)"/>
               <ellipse cx="50" cy="50" rx="38" ry="10" fill="none" stroke="#FFE44D" stroke-width="2" opacity="0.5"/>`),
      },
      {
        id: 'devil_horns',
        label: 'Devil Horns',
        defaultX: 0.5, defaultY: 0.06, defaultSize: 0.45,
        svg: S(`<polygon points="25,70 15,20 40,60" fill="#C0392B" stroke="#922B21" stroke-width="2"/>
               <polygon points="75,70 85,20 60,60" fill="#C0392B" stroke="#922B21" stroke-width="2"/>
               <polygon points="25,70 15,20 25,45" fill="#E74C3C" opacity="0.5"/>
               <polygon points="75,70 85,20 75,45" fill="#E74C3C" opacity="0.5"/>`),
      },
      {
        id: 'sparkles_effect',
        label: 'Sparkles',
        defaultX: 0.5, defaultY: 0.2, defaultSize: 0.6,
        svg: S(`<polygon points="20,10 22,18 30,20 22,22 20,30 18,22 10,20 18,18" fill="#FFD700"/>
               <polygon points="80,15 82,21 88,23 82,25 80,31 78,25 72,23 78,21" fill="#FFD700"/>
               <polygon points="15,70 17,76 23,78 17,80 15,86 13,80 7,78 13,76" fill="#FFD700"/>
               <polygon points="85,65 87,71 93,73 87,75 85,81 83,75 77,73 83,71" fill="#FFD700"/>
               <polygon points="50,5 52,13 60,15 52,17 50,25 48,17 40,15 48,13" fill="#FFD700"/>
               <circle cx="30" cy="45" r="3" fill="#FFD700" opacity="0.6"/>
               <circle cx="70" cy="40" r="3" fill="#FFD700" opacity="0.6"/>
               <circle cx="55" cy="80" r="2" fill="#FFD700" opacity="0.6"/>`),
      },
      {
        id: 'rainbow',
        label: 'Rainbow',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.7,
        svg: S(`<path d="M5 75 Q5 20 50 20 Q95 20 95 75" fill="none" stroke="#E74C3C" stroke-width="7"/>
               <path d="M12 75 Q12 28 50 28 Q88 28 88 75" fill="none" stroke="#E67E22" stroke-width="7"/>
               <path d="M19 75 Q19 36 50 36 Q81 36 81 75" fill="none" stroke="#F1C40F" stroke-width="7"/>
               <path d="M26 75 Q26 44 50 44 Q74 44 74 75" fill="none" stroke="#2ECC71" stroke-width="7"/>
               <path d="M33 75 Q33 52 50 52 Q67 52 67 75" fill="none" stroke="#3498DB" stroke-width="7"/>
               <path d="M40 75 Q40 60 50 60 Q60 60 60 75" fill="none" stroke="#9B59B6" stroke-width="7"/>`),
      },
      {
        id: 'fire_effect',
        label: 'Fire Aura',
        defaultX: 0.5, defaultY: 0.1, defaultSize: 0.55,
        svg: S(`<path d="M50 95 Q20 80 15 60 Q10 40 25 25 Q20 40 35 45 Q25 30 40 15 Q38 30 50 35 Q42 20 55 5 Q60 20 58 35 Q70 25 68 40 Q80 30 75 50 Q85 45 80 65 Q75 80 50 95Z" fill="#E74C3C" opacity="0.9"/>
               <path d="M50 88 Q30 75 28 58 Q26 44 38 34 Q34 46 44 50 Q38 40 48 25 Q52 38 55 42 Q58 32 62 42 Q70 38 68 52 Q74 46 70 62 Q66 76 50 88Z" fill="#FF6B35"/>
               <path d="M50 80 Q36 68 35 56 Q34 46 44 40 Q40 50 50 55 Q52 45 58 50 Q62 46 60 58 Q58 68 50 80Z" fill="#FFD700"/>`),
      },
      {
        id: 'star_eyes',
        label: 'Star Eyes',
        defaultX: 0.5, defaultY: 0.38, defaultSize: 0.5,
        svg: S(`<polygon points="25,40 27,48 35,50 27,52 25,60 23,52 15,50 23,48" fill="#FFD700"/>
               <polygon points="75,40 77,48 85,50 77,52 75,60 73,52 65,50 73,48" fill="#FFD700"/>
               <polygon points="25,42 26,46 30,47 26,48 25,52 24,48 20,47 24,46" fill="white"/>
               <polygon points="75,42 76,46 80,47 76,48 75,52 74,48 70,47 74,46" fill="white"/>`),
      },
    ],
  },
];