// Seasonal decoration for the public website. Every moment in here is Alberta
// wall-clock time. Alberta now keeps one fixed offset all year (it no longer
// falls back in November), so the offset is applied directly instead of asking
// a time-zone database that would still switch the clocks.

const ALBERTA_OFFSET_MS = -6 * 60 * 60 * 1000;

// The instant at which an Alberta wall-clock date and time begins.
function albertaInstant(year, month, day, hour = 0, minute = 0) {
  return Date.UTC(year, month - 1, day, hour, minute) - ALBERTA_OFFSET_MS;
}

// The Alberta calendar date and clock time at a given instant.
export function albertaParts(instant) {
  const d = new Date(instant + ALBERTA_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

// Canadian Thanksgiving is the second Monday in October, so Halloween begins
// the morning after it.
export function thanksgivingDay(year) {
  const octoberFirst = new Date(Date.UTC(year, 9, 1));
  const firstMonday = 1 + ((1 - octoberFirst.getUTCDay() + 7) % 7);
  return firstMonday + 7;
}

const HALLOWEEN_PALETTE = {
  surface: '#1b1030',
  primary: '#f97316',
  secondary: '#7c3aed',
  accent: '#22c55e',
  ink: '#fff7ed',
};

const CHRISTMAS_PALETTE = {
  surface: '#0b2418',
  primary: '#dc2626',
  secondary: '#166534',
  accent: '#facc15',
  ink: '#f0fdf4',
};

const NEW_YEAR_PALETTE = {
  surface: '#0b1120',
  primary: '#facc15',
  secondary: '#1e3a8a',
  accent: '#38bdf8',
  ink: '#e0e7ff',
};

// A stage that swaps the hero photo. Halloween replaces the sunflower in the
// hero with a carved jack-o'-lantern; every other stage keeps the site's own
// photo, which is why an empty entry means "leave the hero image alone".
const STAGE_HERO_IMAGES = {
  halloween:
    'https://media.base44.com/images/public/6a249282cb496579542673b7/0df1d58f0_generated_image.png',
};

function heroImageFor(stageId) {
  return STAGE_HERO_IMAGES[stageId] || '';
}

// Every stage the site can be in, in the order they are offered for a manual
// switch. hero_template replaces {year} with the year being welcomed in.
export const THEME_STAGES = [
  {
    id: 'none',
    theme: 'none',
    label: 'No theme',
    description: 'The website in its normal Candora colours.',
    motif: '',
    palette: null,
    hero_template: '',
    fireworks: false,
    countdown: false,
  },
  {
    id: 'halloween',
    theme: 'halloween',
    label: 'Halloween',
    description: 'Autumn oranges and purples with bats and pumpkins around the site.',
    motif: 'bats_and_pumpkins',
    palette: HALLOWEEN_PALETTE,
    hero_template: '',
    fireworks: false,
    countdown: false,
  },
  {
    id: 'christmas',
    theme: 'christmas',
    label: 'Christmas',
    description: 'Deep greens and reds with snow, garlands and twinkling lights.',
    motif: 'snow_and_lights',
    palette: CHRISTMAS_PALETTE,
    hero_template: '',
    fireworks: false,
    countdown: false,
  },
  {
    id: 'christmas_day',
    theme: 'christmas',
    label: 'Christmas Day',
    description: 'The Christmas theme with the hero reading "Merry Christmas!".',
    motif: 'snow_and_lights',
    palette: CHRISTMAS_PALETTE,
    hero_template: 'Merry Christmas!',
    fireworks: false,
    countdown: false,
  },
  {
    id: 'new_year_eve',
    theme: 'new_year',
    label: "New Year's Eve",
    description: 'Midnight blues and gold with a live countdown to midnight in Alberta.',
    motif: 'countdown',
    palette: NEW_YEAR_PALETTE,
    hero_template: '',
    fireworks: false,
    countdown: true,
  },
  {
    id: 'new_year_day',
    theme: 'new_year',
    label: "New Year's Day",
    description: 'Animated fireworks behind a hero that welcomes the new year.',
    motif: 'fireworks',
    palette: NEW_YEAR_PALETTE,
    hero_template: 'Happy New Year {year}!',
    fireworks: true,
    countdown: false,
  },
];

function stageById(id) {
  return THEME_STAGES.find((stage) => stage.id === id) || THEME_STAGES[0];
}

// The windows one calendar year's holiday run occupies. All of them begin and
// end at midnight Alberta time.
export function themeWindows(year) {
  const next = year + 1;
  return [
    {
      id: 'halloween',
      schedule_label: 'Halloween',
      start: albertaInstant(year, 10, thanksgivingDay(year) + 1),
      end: albertaInstant(year, 11, 1),
    },
    {
      id: 'christmas',
      schedule_label: 'Christmas',
      start: albertaInstant(year, 12, 1),
      end: albertaInstant(year, 12, 25),
    },
    {
      id: 'christmas_day',
      schedule_label: 'Christmas Day',
      start: albertaInstant(year, 12, 25),
      end: albertaInstant(year, 12, 26),
    },
    {
      id: 'christmas',
      schedule_label: 'Christmas continues',
      start: albertaInstant(year, 12, 26),
      end: albertaInstant(year, 12, 31),
    },
    {
      id: 'new_year_eve',
      schedule_label: "New Year's Eve",
      start: albertaInstant(year, 12, 31),
      end: albertaInstant(next, 1, 1),
    },
    {
      id: 'new_year_day',
      schedule_label: "New Year's Day",
      start: albertaInstant(next, 1, 1),
      end: albertaInstant(next, 1, 2),
    },
  ];
}

// The window the site is inside right now, if any. January 1st and 2nd belong
// to the previous year's run, so both cycles are checked.
export function activeThemeWindow(now = Date.now()) {
  const { year } = albertaParts(now);
  const windows = [...themeWindows(year - 1), ...themeWindows(year)];
  return windows.find((window) => now >= window.start && now < window.end) || null;
}

export function upcomingThemeWindows(now = Date.now(), count = 6) {
  const { year } = albertaParts(now);
  return [...themeWindows(year), ...themeWindows(year + 1)]
    .filter((window) => window.start > now)
    .sort((a, b) => a.start - b.start)
    .slice(0, count);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function albertaDateLabel(instant, referenceYear) {
  const { year, month, day } = albertaParts(instant);
  const label = `${MONTHS[month - 1]} ${day}`;
  return year === referenceYear ? label : `${label}, ${year}`;
}

// The next 1 January at or after now — what a countdown counts down to.
function nextNewYearStart(now) {
  const { year } = albertaParts(now);
  const januaryFirst = albertaInstant(year, 1, 1);
  return januaryFirst > now ? januaryFirst : albertaInstant(year + 1, 1, 1);
}

function buildTheme(stageId, now, source, window) {
  const stage = stageById(stageId);
  const newYearStart = window
    ? stage.countdown
      ? window.end
      : window.start
    : nextNewYearStart(now);
  const newYear = albertaParts(newYearStart).year;

  return {
    id: stage.id,
    theme: stage.theme,
    active: stage.id !== 'none',
    label: stage.label,
    description: stage.description,
    motif: stage.motif,
    palette: stage.palette,
    // Empty means the website keeps the headline written in Site Settings.
    hero_headline: stage.hero_template ? stage.hero_template.replace('{year}', String(newYear)) : '',
    // Empty means the website keeps the hero photo written in Site Settings.
    hero_image_url: heroImageFor(stage.id),
    countdown_to: stage.countdown ? new Date(newYearStart).toISOString() : '',
    fireworks: !!stage.fireworks,
    ends_at: window ? new Date(window.end).toISOString() : '',
    source,
  };
}

// What the public website is sent for the current moment. Automatic follows the
// calendar, off leaves the site plain, and manual pins one stage for testing.
export function resolveTheme(settings, now = Date.now()) {
  const mode = settings?.theme_mode || 'auto';
  if (mode === 'off') return buildTheme('none', now, 'off', null);
  if (mode === 'manual') {
    return buildTheme(settings?.theme_manual_stage || 'none', now, 'manual', null);
  }
  const window = activeThemeWindow(now);
  return buildTheme(window ? window.id : 'none', now, 'auto', window);
}

// The stage list Website Studio offers for a manual switch, each already worked
// out so a preview shows real copy and a real countdown target.
export function publicThemeStages(now = Date.now()) {
  return THEME_STAGES.map((stage) => {
    const built = buildTheme(stage.id, now, 'preview', null);
    return {
      id: built.id,
      label: built.label,
      description: built.description,
      motif: built.motif,
      palette: built.palette,
      hero_headline: built.hero_headline,
      hero_image_url: built.hero_image_url,
      countdown_to: built.countdown_to,
      fireworks: built.fireworks,
    };
  });
}

// The automatic calendar, written out for Website Studio.
export function themeSchedule(now = Date.now(), count = 6) {
  const referenceYear = albertaParts(now).year;
  return upcomingThemeWindows(now, count).map((window) => ({
    id: window.id,
    label: window.schedule_label,
    start_label: albertaDateLabel(window.start, referenceYear),
    end_label: albertaDateLabel(window.end, referenceYear),
  }));
}

export function activeThemeSummary(now = Date.now()) {
  const window = activeThemeWindow(now);
  if (!window) return { id: 'none', label: 'No theme', ends_label: '' };
  return {
    id: window.id,
    label: window.schedule_label,
    ends_label: albertaDateLabel(window.end, albertaParts(now).year),
  };
}