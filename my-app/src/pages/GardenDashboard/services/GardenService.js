// GardenService.js
// Data layer for the Garden Dashboard screen.
// Follows the same pattern as DashboardService.js
//
// CHANGED: saveScanToGarden() now accepts the Gemini `analysis` object
// and maps it onto the catalog `plants` doc (sunlight, watering,
// fertilizing, growthDays, description, pests). Also now stamps
// plantedDate on the new userPlants doc so day-count / progress
// tracking works immediately after a scan.
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
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { findPlantByName, addPlantToCatalog } from '../../PlantDirectory/services/PlantService';
import {
  remoteThenLocal,
  remoteThenLocalDoc,
  createDocOnlineFirst,
  updateDocOnlineFirst,
  getActiveUserId,
} from '../../../offline/offlineStore';

// ─────────────────────────────────────────────────────────────
// 1. USER PLANTS
// ─────────────────────────────────────────────────────────────

const sortByCreatedDesc = (docs) =>
  [...docs].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return db_ - da;
  });

export async function fetchUserPlants(userId) {
  const docs = await remoteThenLocal(userId, 'userPlants', async () => {
    const q = query(
      collection(db, 'userPlants'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return sortByCreatedDesc(docs);
}

export async function fetchUserPlantById(userPlantId) {
  const userId = getActiveUserId();
  return remoteThenLocalDoc(userId, 'userPlants', userPlantId, async () => {
    const snap = await getDoc(doc(db, 'userPlants', userPlantId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
}


export async function fetchFeaturedPlant(userId) {
  const docs = await remoteThenLocal(userId, 'userPlants', async () => {
    const q = query(
      collection(db, 'userPlants'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  const sorted = sortByCreatedDesc(docs);
  return sorted[0] ?? null;
}

export async function updatePlantHealth(userPlantId, healthStatus) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'userPlants', userPlantId, { healthStatus });
}


// ── NEW: small parsers to turn Gemini's free-text guides into the
// numeric/keyed fields the rest of the app (ProgressView,
// BotanicalSpecsView, sunlightLabel) already expects. ──

/**
 * Pull the first integer out of a frequency string like
 * "Every 7-10 days" or "Every 4-6 weeks" → returns days.
 * Weeks are converted to days. Falls back to null if nothing parses.
 */
function parseFrequencyDays(text = '') {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return /week/i.test(text) ? n * 7 : n;
}

/**
 * Map Gemini's free-text sunlight requirement onto the short keys
 * sunlightLabel() understands (direct/partial/indirect/low/shade).
 */
function inferSunlightKey(text = '') {
  const t = text.toLowerCase();
  if (t.includes('indirect')) return 'indirect';
  if (t.includes('partial'))  return 'partial';
  if (t.includes('low'))      return 'low';
  if (t.includes('shade'))    return 'shade';
  if (t.includes('direct') || t.includes('full')) return 'direct';
  return '';
}

/**
 * Build the fields addPlantToCatalog() needs from a Gemini analysis
 * object. Any field Gemini didn't provide is simply omitted so
 * addPlantToCatalog's own defaults (0 / '' / []) apply.
 */
function mapAnalysisToCatalogFields(analysis) {
  if (!analysis) return {};

  const wateringFrequency   = parseFrequencyDays(analysis.wateringGuide?.frequency);
  const fertilizerFrequency = parseFrequencyDays(analysis.fertilizingGuide?.frequency);
  const sunlight            = inferSunlightKey(analysis.sunlightGuide?.requirement);
  const growthDays          = parseFrequencyDays(analysis.growthTimeline?.maturity);

  return {
    description:          analysis.overview ?? '',
    sunlight:              sunlight || undefined,
    wateringFrequency:     wateringFrequency ?? undefined,
    fertilizerFrequency:   fertilizerFrequency ?? undefined,
    growthDays:            growthDays ?? undefined,
    pests:                 Array.isArray(analysis.commonPests) ? analysis.commonPests : undefined,
  };
}

export async function saveScanToGarden(userId, plantData, analysis = null, scanId = null) {
  if (!userId) throw new Error('User must be signed in to save to garden.');

  const statusRaw = (plantData?.healthStatus || '').toUpperCase();
  const hasAnomaly = plantData?.anomalies && plantData.anomalies !== 'None';
  const healthStatus = statusRaw.includes('HEALTHY') && !hasAnomaly
    ? 'HEALTHY'
    : statusRaw.includes('SICK')
      ? 'SICK'
      : 'WARNING';

  const plantName = plantData?.commonName || 'Unknown Plant';
  let catalogPlant = await findPlantByName(plantName);
  let plantId = catalogPlant?.id ?? null;

  if (!catalogPlant) {
    plantId = await addPlantToCatalog({
      name: plantName,
      scientificName: plantData?.scientificName,
      imageUrl: plantData?.imageSrc,
      ...mapAnalysisToCatalogFields(analysis),
    });
  } else {
    // Existing catalog entry (e.g. created before this fix, or by an
    // earlier scan that had no analysis yet) — backfill any fields
    // it's still missing instead of leaving them empty forever.
    const freshFields = mapAnalysisToCatalogFields(analysis);
    const missingFields = Object.fromEntries(
      Object.entries(freshFields).filter(([key, value]) => value !== undefined && !catalogPlant[key])
    );
    if (Object.keys(missingFields).length > 0) {
      await updateDoc(doc(db, 'plants', plantId), missingFields);
    }
  }

  const docRef = await addDoc(collection(db, 'userPlants'), {
    userId,
    scanId: scanId ?? null,
    plantId,

    nickname:       plantData?.commonName     || 'My Plant',
    commonName:     plantData?.commonName     || 'Unknown Plant',
    scientificName: plantData?.scientificName || '',
    imageUrl:       plantData?.imageSrc        || '',

    healthStatus,
    currentStage: 'Early Growth',
    plantedDate:  serverTimestamp(),

    createdAt: serverTimestamp(),
  });

  return docRef.id;
}


// ─────────────────────────────────────────────────────────────
// 2. REMINDERS  (used as Care Schedule)
// ─────────────────────────────────────────────────────────────


export async function fetchTodayReminders(userId) {
  const docs = await remoteThenLocal(userId, 'reminders', async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'reminders'),
      where('userId',       '==', userId),
      where('reminderDate', '>=', Timestamp.fromDate(start)),
      where('reminderDate', '<=', Timestamp.fromDate(end)),
      orderBy('reminderDate', 'asc'),
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return docs
    .filter((r) => {
      const d = r.reminderDate?.toDate ? r.reminderDate.toDate() : new Date(r.reminderDate);
      return d >= start && d <= end;
    })
    .sort((a, b) => {
      const da = a.reminderDate?.toDate ? a.reminderDate.toDate() : new Date(a.reminderDate);
      const db_ = b.reminderDate?.toDate ? b.reminderDate.toDate() : new Date(b.reminderDate);
      return da - db_;
    });
}


export async function completeReminder(reminderId) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'reminders', reminderId, { status: 'COMPLETED' });
}

export async function uncompleteReminder(reminderId) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'reminders', reminderId, { status: 'PENDING' });
}

export async function createReminder(data) {
  const payload = {
    ...data,
    reminderDate: data.reminderDate instanceof Date
      ? Timestamp.fromDate(data.reminderDate)
      : data.reminderDate,
    status:    'PENDING',
    completed: false,
    createdAt: Timestamp.now(),
  };
  const created = await createDocOnlineFirst(data.userId, 'reminders', payload);
  return created.id;
}


// ─────────────────────────────────────────────────────────────
// 3. HEALTH STATS  (derived from userPlants)
// ─────────────────────────────────────────────────────────────

export function computeGardenStats(userPlants) {
  const total   = userPlants.length;
  const healthy = userPlants.filter(p => p.healthStatus === 'HEALTHY').length;
  const warning = userPlants.filter(p => p.healthStatus === 'WARNING').length;
  const sick    = userPlants.filter(p => p.healthStatus === 'SICK').length;

  const score = total === 0 ? 100 : Math.round((healthy / total) * 100);

  return {
    totalPlants:    total,
    healthyCount:   healthy,
    warningCount:   warning,
    sickCount:      sick,
    healthScorePct: score,
  };
}


// ─────────────────────────────────────────────────────────────
// 4. PLANT CATALOG  (master plants collection)
// ─────────────────────────────────────────────────────────────


export async function fetchPlantCatalog() {
  const userId = getActiveUserId();
  return remoteThenLocal(userId, 'plants', async () => {
    const snap = await getDocs(collection(db, 'plants'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
}


export async function fetchPlantById(plantId) {
  const userId = getActiveUserId();
  return remoteThenLocalDoc(userId, 'plants', plantId, async () => {
    const snap = await getDoc(doc(db, 'plants', plantId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
}


// ─────────────────────────────────────────────────────────────
// 5. AGGREGATE  – single call that loads everything the garden
//    dashboard needs
// ─────────────────────────────────────────────────────────────


export async function loadGardenDashboard(userId) {
  const [userPlants, todayReminders] = await Promise.all([
    fetchUserPlants(userId),
    fetchTodayReminders(userId),
  ]);

  const featuredPlant = userPlants[0] ?? null;
  const stats         = computeGardenStats(userPlants);

  return { userPlants, featuredPlant, todayReminders, stats };
}