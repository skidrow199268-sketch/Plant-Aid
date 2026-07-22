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

// ─────────────────────────────────────────────────────────────
// 1. WEATHER  (OpenWeatherMap – or any API with VITE_WEATHER_API)
// ─────────────────────────────────────────────────────────────

export async function fetchWeather(lat, lon) {
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
    cityName:    data.name ?? '',
    wind:        Math.round(data.wind?.speed ?? 0),
    isRainy,
    isSunny,
    isHumid:     humidity >= 70,
  };
}


export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 14.5995, lon: 120.9842 }); // Manila fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()    => resolve({ lat: 14.5995, lon: 120.9842 }),
      { timeout: 6000 },
    );
  });
}


export function getBotanicalInsight(weather) {
  if (!weather) return 'Check on your plants today and make sure they have enough light and water.';

  if (weather.isRainy)
    return 'Rain is on the way! Skip manual watering today – your outdoor plants are covered. Watch for waterlogged soil and ensure drainage is clear.';

  if (weather.isHumid && weather.isSunny)
    return `High humidity (${weather.humidity}%) with sunshine is perfect for tropical misting. Give your Monstera and Calathea collection some love this afternoon.`;

  if (weather.temp >= 32)
    return `It's ${weather.temp}°C outside – heat stress alert! Move sensitive plants out of direct afternoon sun and increase watering frequency today.`;

  if (weather.temp <= 18)
    return `Cool temperatures today (${weather.temp}°C). Keep tropical plants away from draughty windows and hold off on fertilising until it warms up.`;

  if (weather.isHumid)
    return `Humidity is at ${weather.humidity}% – great conditions for propagation. Consider misting leafy plants and checking for fungal issues on dense foliage.`;

  return `${weather.temp}°C with ${weather.description} – a great day for outdoor plant care. Ideal conditions for repotting or transplanting seedlings.`;
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