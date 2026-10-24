// ============================================================
// DashboardService.js
// Centralised data layer for the Dashboard (Today) screen.
// Mirrors the pattern used in AuthContext – pure async functions
// that the UI can call directly or wrap in useEffect / custom hooks.
// ============================================================

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { getSeasonalTip } from '../utils/season';

// ─────────────────────────────────────────────────────────────
// 1. WEATHER  (OpenWeatherMap – or any API with VITE_WEATHER_API)
// ─────────────────────────────────────────────────────────────

export async function fetchWeather(lat, lon, nameOverride, countryOverride) {
  const apiKey = import.meta.env.VITE_WEATHER_API;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();

  const weatherId = data.weather?.[0]?.id ?? 800;
  const isRainy   = weatherId >= 200 && weatherId < 700;
  const isSunny   = weatherId >= 800;
  const humidity  = data.main?.humidity ?? 0;

  return {
    temp:        Math.round(data.main?.temp ?? 0),
    feelsLike:   Math.round(data.main?.feels_like ?? 0),
    humidity,
    description: data.weather?.[0]?.description ?? '',
    icon:        data.weather?.[0]?.icon ?? '01d',
    cityName:    nameOverride ?? data.name ?? '',
    country:     countryOverride ?? data.sys?.country ?? '',
    lat,
    lon,
    wind:        Math.round(data.wind?.speed ?? 0),
    isRainy,
    isSunny,
    isHumid:     humidity >= 70,
  };
}


// 5-day forecast (3-hourly steps) aggregated into daily buckets.
// Free OpenWeatherMap tier → today + 4 upcoming days.
// Returns [{ key, day, icon, description, temp, max, min, humidity, isRainy }]
// (ordered oldest → newest; first entry is today).
export async function fetchForecast(lat, lon) {
  const apiKey = import.meta.env.VITE_WEATHER_API;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast API error: ${res.status}`);

  const data = await res.json();
  const list = data.list ?? [];
  if (!list.length) throw new Error('Forecast API returned no data');

  // Group the 3-hourly entries into local calendar days.
  const byDay = new Map();
  for (const entry of list) {
    const date = new Date(entry.dt * 1000);
    const key = date.toDateString();
    if (!byDay.has(key)) byDay.set(key, { date, entries: [] });
    byDay.get(key).entries.push(entry);
  }

  return Array.from(byDay.values()).map(({ date, entries }) => {
    const temps    = entries.map((e) => e.main?.temp ?? 0);
    const max      = Math.round(Math.max(...temps));
    const min      = Math.round(Math.min(...temps));
    const humidity = Math.round(
      entries.reduce((sum, e) => sum + (e.main?.humidity ?? 0), 0) / entries.length,
    );
    const isRainy = entries.some((e) => {
      const id = e.weather?.[0]?.id ?? 800;
      return id >= 200 && id < 700;
    });

    // Representative icon/description: the entry closest to 1 PM (midday).
    const mid = entries.reduce((best, e) =>
      Math.abs(new Date(e.dt * 1000).getHours() - 13) <
      Math.abs(new Date(best.dt * 1000).getHours() - 13) ? e : best,
    entries[0]);

    return {
      key:         date.toDateString(),              // local-day key for comparisons
      day:         date.toLocaleDateString('en-US', { weekday: 'short' }),
      icon:        mid.weather?.[0]?.icon ?? '01d',
      description: mid.weather?.[0]?.description ?? '',
      temp:        max,
      max,
      min,
      humidity,
      isRainy,
    };
  });
}


// ─────────────────────────────────────────────────────────────
// 1b. HOME LOCATION (user-chosen — always wins over auto-detection)
//
// Auto-detected coordinates (GPS or IP) are only ever approximate —
// IP geolocation in particular can land tens of kilometres away.
// A location the user explicitly picked (city search or a precise
// GPS fix) is persisted and takes priority over everything else.
// ─────────────────────────────────────────────────────────────

const HOME_LOCATION_KEY = 'plantAid.homeLocation';

export function getHomeLocation() {
  try {
    const raw = localStorage.getItem(HOME_LOCATION_KEY);
    const home = raw ? JSON.parse(raw) : null;
    if (
      home &&
      typeof home.lat === 'number' &&
      typeof home.lon === 'number' &&
      typeof home.label === 'string'
    ) {
      return home;
    }
  } catch {
    /* corrupted cache — ignore */
  }
  return null;
}

export function saveHomeLocation(loc) {
  try {
    localStorage.setItem(HOME_LOCATION_KEY, JSON.stringify(loc));
  } catch {
    /* storage unavailable (private mode) — non-fatal */
  }
  return loc;
}

export function clearHomeLocation() {
  try {
    localStorage.removeItem(HOME_LOCATION_KEY);
  } catch {
    /* ignore */
  }
}

// City search via OpenWeatherMap Geocoding (free with the same API key).
// Results are restricted to the Philippines: the ", PH" suffix biases
// the lookup first, and anything outside 'PH' is filtered out.
// Returns [{ label, name, state, country, lat, lon }] sorted by relevance.
export async function searchLocationOptions(searchQuery) {
  const apiKey = import.meta.env.VITE_WEATHER_API;
  const q = String(searchQuery ?? '').trim();
  if (!q) return [];

  const attempt = async (qStr) => {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(qStr)}&limit=5&appid=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(err);
      return [];
    }
  };

  let data = await attempt(`${q},PH`);
  let list = (data ?? []).filter((c) => c?.country?.toUpperCase() === 'PH');
  if (!list.length) {
    data = await attempt(q);
    list = (data ?? []).filter((c) => c?.country?.toUpperCase() === 'PH');
  }
  return list.map((place) => ({
    label:   [place.name, place.state, place.country].filter(Boolean).join(', '),
    name:    place.name ?? '',
    state:   place.state ?? '',
    country: place.country ?? '',
    lat:     place.lat,
    lon:     place.lon,
  }));
}

// Resolve a place picked from the bundled PH list (philippines-locations.json)
// into coordinates. The city name is looked up via OpenWeatherMap
// Geocoding (restricted to "PH"), with the picked province/region used
// to disambiguate same-named municipalities (e.g. "San Jose").
export async function geocodePHPlace({ name, provinceName, regionName }) {
  const apiKey = import.meta.env.VITE_WEATHER_API;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(`${name},PH`)}&limit=10&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);

  const candidates = ((await res.json()) ?? []).filter((c) => c.country === 'PH');
  if (!candidates.length) throw new Error(`Could not resolve coordinates for ${name}.`);

  const normalize = (s) =>
    String(s ?? '').toLowerCase().replace(/\bcity of\b|\bcity\b/g, '').trim();

  const best = candidates.reduce((best, c) => {
    const scoreOf = (c) => {
      let score = normalize(c.name) === normalize(name) ? 4 : 0;
      const state = String(c.state ?? '').toLowerCase();
      if (provinceName && state.includes(provinceName.toLowerCase())) score += 2;
      if (regionName && state.includes(regionName.toLowerCase()))    score += 1;
      return score;
    };
    return scoreOf(c) > scoreOf(best) ? c : best;
  }, candidates[0]);

  return { lat: best.lat, lon: best.lon };
}

// Reverse geocode a coordinate pair into a human-readable label.
export async function reverseGeocoding(lat, lon) {
  const apiKey = import.meta.env.VITE_WEATHER_API;
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.[0];
    if (!place) return null;
    return {
      label: [place.name, place.state, place.country].filter(Boolean).join(', '),
      name:  place.name ?? '',
      state: place.state ?? '',
      country: place.country ?? '',
      lat,
      lon,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Location detection.
//
// Resolution order (first success wins):
//   1. User-chosen home location (search result or saved GPS fix)
//   2. Fresh cached fix from this device (no prompt, no delay)
//   3. Browser geolocation  (most accurate)
//   4. IP-based geolocation (city-level, works when permission
//      is denied / unsupported / times out)
//   5. Stale cached fix
//   6. Manila last-resort fallback (never silently preferred over
//      a better source)
//
// The resolved object carries a `source` field so the UI can
// show an "approximate" hint when the fix is coarse.
// ─────────────────────────────────────────────────────────────

const MANILA_FALLBACK = { lat: 14.5995, lon: 120.9842 };
const LOCATION_CACHE_KEY = 'plantAid.lastLocation';
// A cached GPS fix is considered "fresh" (good enough to skip the
// permission prompt) for 30 minutes.
const FRESH_CACHE_MS = 30 * 60 * 1000;

function readCachedLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (
      typeof cached?.lat === 'number' &&
      typeof cached?.lon === 'number' &&
      typeof cached?.savedAt === 'number'
    ) {
      return cached;
    }
  } catch {
    /* corrupted cache — ignore */
  }
  return null;
}

function cacheLocation(location) {
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({
        lat: location.lat,
        lon: location.lon,
        source: location.source,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* storage unavailable (private mode) — non-fatal */
  }
}

// Single IP-geo provider attempt: resolves to {lat, lon} or null.
async function fetchFromProvider(url, parse) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return parse(await res.json());
  } catch {
    return null;
  }
}

// City-level accuracy via the visitor's IP. Two free providers are
// tried in order so one being down doesn't fall through to Manila.
async function fetchIPLocation() {
  const providers = [
    {
      url: 'https://get.geojs.io/v1/ip/geo.json',
      parse: (d) =>
        d?.latitude && d?.longitude
          ? { lat: parseFloat(d.latitude), lon: parseFloat(d.longitude) }
          : null,
    },
    {
      url: 'https://ipapi.co/json/',
      parse: (d) =>
        typeof d?.latitude === 'number' && typeof d?.longitude === 'number'
          ? { lat: d.latitude, lon: d.longitude }
          : null,
    },
  ];

  for (const { url, parse } of providers) {
    const result = await fetchFromProvider(url, parse);
    if (result) return { ...result, source: 'ip' };
  }
  return null;
}

export function getUserLocation() {
  // 1. User-chosen home location — always respected first.
  const home = getHomeLocation();
  if (home) {
    return Promise.resolve({
      lat: home.lat,
      lon: home.lon,
      name: home.name,
      country: home.country,
      source: 'saved',
    });
  }

  return new Promise((resolve) => {
    const cached = readCachedLocation();

    // 1. Fresh cache → skip the whole detection dance.
    if (cached && Date.now() - cached.savedAt < FRESH_CACHE_MS) {
      resolve({ lat: cached.lat, lon: cached.lon, source: cached.source });
      return;
    }

    // 2. Browser geolocation (wifi-based fixes are plenty for weather,
    //    and `enableHighAccuracy: false` resolves much faster).
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            source: 'gps',
          };
          cacheLocation(location);
          resolve(location);
        },
        (err) => {
          console.warn('[weather] geolocation failed:', err?.message, '— falling back to IP lookup');
          // 3. IP lookup, then stale cache, then Manila.
          fetchIPLocation().then((ipLocation) => {
            const location =
              ipLocation
              ?? (cached && { lat: cached.lat, lon: cached.lon, source: cached.source })
              ?? { ...MANILA_FALLBACK, source: 'fallback' };
            if (ipLocation) cacheLocation(location);
            resolve(location);
          });
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 5 * 60 * 1000 },
      );
      return;
    }

    // 2b. Geolocation unsupported → IP lookup, then cache, then Manila.
    console.warn('[weather] geolocation unsupported — falling back to IP lookup');
    fetchIPLocation().then((ipLocation) => {
      const location =
        ipLocation
        ?? (cached && { lat: cached.lat, lon: cached.lon, source: cached.source })
        ?? { ...MANILA_FALLBACK, source: 'fallback' };
      if (ipLocation) cacheLocation(location);
      resolve(location);
    });
  });
}


export function getBotanicalInsight(weather) {
  if (!weather) return 'Check on your plants today and make sure they have enough light and water.';

  const seasonalTip = getSeasonalTip(weather);
  const withSeason = (text) => (seasonalTip ? `${text} ${seasonalTip}` : text);

  if (weather.isRainy)
    return withSeason('Rain is on the way! Skip manual watering today – your outdoor plants are covered. Watch for waterlogged soil and ensure drainage is clear.');

  if (weather.isHumid && weather.isSunny)
    return withSeason(`High humidity (${weather.humidity}%) with sunshine is perfect for tropical misting. Give your Monstera and Calathea collection some love this afternoon.`);

  if (weather.temp >= 32)
    return withSeason(`It's ${weather.temp}°C outside – heat stress alert! Move sensitive plants out of direct afternoon sun and increase watering frequency today.`);

  if (weather.temp <= 18)
    return withSeason(`Cool temperatures today (${weather.temp}°C). Protect sensitive plants from cold drafts and hold off on fertilising until it warms up.`);

  if (weather.isHumid)
    return withSeason(`Humidity is at ${weather.humidity}% – great conditions for propagation. Consider misting leafy plants and checking for fungal issues on dense foliage.`);

  return withSeason(`${weather.temp}°C with ${weather.description} – a great day for outdoor plant care. Ideal conditions for repotting or transplanting seedlings.`);
}


// ─────────────────────────────────────────────────────────────
// 2. REMINDERS
// ─────────────────────────────────────────────────────────────

export async function fetchUpcomingReminders(userId) {
  const q = query(
    collection(db, 'reminders'),
    where('userId', '==', userId),
    where('completed', '==', false),
    orderBy('reminderDate', 'asc'),
    limit(2),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchTodayReminders(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'reminders'),
    where('userId',        '==', userId),
    where('reminderDate',  '>=', Timestamp.fromDate(start)),
    where('reminderDate',  '<=', Timestamp.fromDate(end)),
    orderBy('reminderDate', 'asc'),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


export async function completeReminder(reminderId) {
  await updateDoc(doc(db, 'reminders', reminderId), { status: 'COMPLETED' });
}

/**
 * Mark a reminder as MISSED.
 *
 * @param {string} reminderId
 * @returns {Promise<void>}
 */
export async function missReminder(reminderId) {
  await updateDoc(doc(db, 'reminders', reminderId), { status: 'MISSED' });
}


// ─────────────────────────────────────────────────────────────
// 3. USER PLANTS (for daily care list)
// ─────────────────────────────────────────────────────────────


export async function fetchUserPlants(userId) {
  const q = query(
    collection(db, 'userPlants'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


export async function fetchUserPlantById(userPlantId) {
  const snap = await getDoc(doc(db, 'userPlants', userPlantId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


export async function updatePlantHealth(userPlantId, healthStatus) {
  await updateDoc(doc(db, 'userPlants', userPlantId), { healthStatus });
}


// ─────────────────────────────────────────────────────────────
// 4. JOURNALS (latest entries for the dashboard)
// ─────────────────────────────────────────────────────────────


export async function fetchRecentJournals(userId, maxItems = 5) {
  const q = query(
    collection(db, 'journals'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


// ─────────────────────────────────────────────────────────────
// 5. IDENTIFICATION HISTORY
// ─────────────────────────────────────────────────────────────


export async function fetchIdentificationHistory(userId, maxItems = 5) {
  const q = query(
    collection(db, 'identificationHistory'),
    where('userId', '==', userId),
    orderBy('scannedAt', 'desc'),
    limit(maxItems),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


// ─────────────────────────────────────────────────────────────
// 6. AGGREGATE – single call that loads everything the dashboard needs
// ─────────────────────────────────────────────────────────────


export async function loadDashboardData(userId) {
  const [userPlants, todayReminders, upcomingReminders, recentJournals] =
    await Promise.all([
      fetchUserPlants(userId),
      fetchTodayReminders(userId),
      fetchUpcomingReminders(userId, 5),
      fetchRecentJournals(userId, 3),
    ]);

  return { userPlants, todayReminders, upcomingReminders, recentJournals };
}