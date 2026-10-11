// ============================================================
// season.js
// Country- and hemisphere-aware season resolution.
//
// Tropical countries (e.g. the Philippines) follow a wet/dry
// season cycle instead of the temperate spring / summer /
// autumn / winter model. Temperate countries fall back to the
// four-season model, flipped for the southern hemisphere.
// ============================================================

// Countries whose climate is best described by a tropical
// wet/dry season cycle rather than four distinct seasons.
const TROPICAL_COUNTRIES = new Set([
  // Southeast Asia
  'PH', 'ID', 'MY', 'SG', 'TH', 'VN', 'KH', 'LA', 'MM', 'BN', 'TL',
  // South Asia
  'IN', 'LK', 'BD', 'MV', 'BT',
  // Sub-Saharan Africa
  'NG', 'GH', 'CI', 'SN', 'CM', 'KE', 'TZ', 'UG', 'ET', 'CD', 'CG',
  'AO', 'MZ', 'ZM', 'ZW', 'MW', 'RW', 'BI', 'SO', 'SS', 'SD', 'GN',
  'ML', 'BF', 'NE', 'TD', 'SL', 'LR', 'TG', 'BJ', 'GM', 'GW', 'GA',
  'GQ', 'CF', 'MG', 'MU', 'SC', 'KM', 'ST', 'CV', 'ER', 'DJ',
  // Latin America & Caribbean
  'BR', 'CO', 'VE', 'PE', 'EC', 'BO', 'PY', 'GY', 'SR', 'GF', 'MX',
  'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'DO', 'HT', 'JM',
  'TT', 'BB', 'BS', 'PR',
  // Oceania
  'FJ', 'PG', 'SB', 'VU', 'NC', 'WS', 'TO', 'PF', 'KI', 'NR', 'TV',
  'FM', 'MH', 'PW', 'GU',
]);

// Country-specific season names and month windows.
// Months are 0-based (JS Date.getMonth()).
const COUNTRY_SEASONS = {
  PH: {
    wet: { label: 'Wet Season', local: 'Tag-ulan', months: [5, 6, 7, 8, 9, 10] },
    dry: { label: 'Dry Season', local: 'Tag-init', months: [11, 0, 1, 2, 3, 4] },
  },
};

// Generic monsoon windows for tropical countries without an override.
const NORTHERN_WET_MONTHS = [4, 5, 6, 7, 8, 9];
const SOUTHERN_WET_MONTHS = [10, 11, 0, 1, 2, 3];

const TEMPERATE = {
  north: {
    spring: [2, 3, 4],
    summer: [5, 6, 7],
    autumn: [8, 9, 10],
    winter: [11, 0, 1],
  },
  south: {
    spring: [8, 9, 10],
    summer: [11, 0, 1],
    autumn: [2, 3, 4],
    winter: [5, 6, 7],
  },
};

const TEMPERATE_LABELS = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

function isTropical(country, lat) {
  if (country && TROPICAL_COUNTRIES.has(country.toUpperCase())) return true;
  if (typeof lat === 'number' && !Number.isNaN(lat)) return Math.abs(lat) < 23.44;
  return false;
}

/**
 * Resolve the current season for a weather payload.
 * @param {{ country?: string, lat?: number } | null} weather
 * @returns {{ key: 'wet'|'dry'|'spring'|'summer'|'autumn'|'winter', label: string } | null}
 */
export function getSeason(weather) {
  if (!weather) return null;

  const month = new Date().getMonth();
  const country = weather.country ? weather.country.toUpperCase() : '';
  const lat = weather.lat;
  const southern = typeof lat === 'number' && lat < 0;

  if (isTropical(country, lat)) {
    const override = COUNTRY_SEASONS[country];
    const wetMonths = override
      ? override.wet.months
      : southern
        ? SOUTHERN_WET_MONTHS
        : NORTHERN_WET_MONTHS;

    if (wetMonths.includes(month)) {
      const wet = override?.wet;
      return { key: 'wet', label: wet ? `${wet.label} (${wet.local})` : 'Wet Season' };
    }

    const dry = override?.dry;
    return { key: 'dry', label: dry ? `${dry.label} (${dry.local})` : 'Dry Season' };
  }

  const table = southern ? TEMPERATE.south : TEMPERATE.north;
  const key = Object.keys(table).find((k) => table[k].includes(month)) ?? 'summer';
  return { key, label: TEMPERATE_LABELS[key] };
}

/**
 * A short plant-care tip tailored to the current season.
 * @param {{ country?: string, lat?: number } | null} weather
 * @returns {string}
 */
export function getSeasonalTip(weather) {
  const season = getSeason(weather);
  if (!season) return '';

  switch (season.key) {
    case 'wet':
      return `${season.label} is here — frequent rain means water sparingly and keep drainage clear to prevent root rot.`;
    case 'dry':
      return `${season.label} is here — soil dries out fast, so check moisture often and water deeply in the morning.`;
    case 'winter':
      return 'Winter dormancy has set in — cut back on watering and fertiliser while growth slows.';
    case 'summer':
      return 'Peak growing season — plants are thirsty, so water more often and watch for heat stress.';
    case 'spring':
      return 'Spring growth is underway — a perfect time to repot, propagate, and resume feeding.';
    case 'autumn':
      return 'Autumn slowdown — taper off fertiliser and start reducing watering.';
    default:
      return '';
  }
}
