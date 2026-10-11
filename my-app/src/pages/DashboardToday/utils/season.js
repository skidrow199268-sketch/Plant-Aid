// ============================================================
// season.js
// Country- and hemisphere-aware season resolution.
//
// Naming follows how people actually talk about the weather:
//   • Tropical / monsoon countries (e.g. the Philippines) have a
//     Rainy Season and a Dry Season — never winter.
//   • Temperate countries use the familiar four seasons
//     (Spring / Summer / Autumn / Winter), flipped south of the
//     equator.
//
// The country is checked first so a tropical country is never
// given a temperate label (and vice-versa). Latitude is only used
// as a fallback when the country is unknown.
// ============================================================

// Countries whose climate is best described by a tropical
// rainy/dry season cycle rather than four distinct seasons.
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

// Countries with four distinct seasons. Listing them explicitly keeps
// their labels stable even when their latitude drifts near the tropics
// (e.g. northern Egypt or Saudi Arabia, which do get a cool season).
const TEMPERATE_COUNTRIES = new Set([
  // North America
  'US', 'CA',
  // Europe
  'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'CH', 'AT', 'IT', 'ES',
  'PT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'RS', 'BA',
  'SI', 'ME', 'MK', 'AL', 'DK', 'SE', 'NO', 'FI', 'IS', 'EE', 'LV',
  'LT', 'UA', 'BY', 'MD', 'RU', 'TR', 'GE', 'AM', 'AZ',
  // Central Asia
  'KZ', 'UZ', 'TM', 'KG', 'TJ', 'MN',
  // East Asia
  'CN', 'JP', 'KR', 'KP', 'TW', 'HK', 'MO',
  // Oceania
  'AU', 'NZ',
  // South America (temperate band)
  'CL', 'AR', 'UY',
  // North Africa & Middle East
  'ZA', 'MA', 'DZ', 'TN', 'LY', 'EG', 'IL', 'PS', 'JO', 'LB', 'SY',
  'IQ', 'IR', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM',
]);

// Country-specific season names and month windows.
// Months are 0-based (JS Date.getMonth()).
const COUNTRY_SEASONS = {
  PH: {
    rainy: { label: 'Rainy Season', local: 'Tag-ulan',  months: [5, 6, 7, 8, 9, 10] },
    dry:   { label: 'Dry Season',   local: 'Tag-init',  months: [11, 0, 1, 2, 3, 4] },
  },
};

// Generic monsoon windows for tropical countries without an override.
const NORTHERN_RAINY_MONTHS = [4, 5, 6, 7, 8, 9];
const SOUTHERN_RAINY_MONTHS = [10, 11, 0, 1, 2, 3];

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

/**
 * Decide whether a location follows the tropical rainy/dry cycle or the
 * temperate four-season cycle. Country wins over latitude so a tropical
 * country is never given a temperate season (and vice-versa).
 * @param {string} country ISO-3166 alpha-2 country code (upper-case)
 * @param {number|undefined} lat
 * @returns {'tropical'|'temperate'}
 */
function resolveClimate(country, lat) {
  if (country && TROPICAL_COUNTRIES.has(country)) return 'tropical';
  if (country && TEMPERATE_COUNTRIES.has(country)) return 'temperate';
  if (typeof lat === 'number' && !Number.isNaN(lat)) {
    // Tropic of Cancer / Capricorn.
    return Math.abs(lat) < 23.44 ? 'tropical' : 'temperate';
  }
  return 'temperate';
}

/**
 * Resolve the current season for a weather payload.
 * @param {{ country?: string, lat?: number } | null} weather
 * @returns {{ key: 'rainy'|'dry'|'spring'|'summer'|'autumn'|'winter', label: string } | null}
 */
export function getSeason(weather) {
  if (!weather) return null;

  const month = new Date().getMonth();
  const country = weather.country ? weather.country.toUpperCase() : '';
  const lat = weather.lat;
  const southern = typeof lat === 'number' && lat < 0;

  if (resolveClimate(country, lat) === 'tropical') {
    const override = COUNTRY_SEASONS[country];
    const rainyMonths = override
      ? override.rainy.months
      : southern
        ? SOUTHERN_RAINY_MONTHS
        : NORTHERN_RAINY_MONTHS;

    if (rainyMonths.includes(month)) {
      const rainy = override?.rainy;
      return { key: 'rainy', label: rainy ? `${rainy.label} (${rainy.local})` : 'Rainy Season' };
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
    case 'rainy':
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
