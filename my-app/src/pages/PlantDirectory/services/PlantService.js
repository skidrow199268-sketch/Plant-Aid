// ============================================================
// PlantDirectoryService.js
// Centralised data layer for the Plant Directory screen.
// Mirrors the pattern used in DashboardService – pure async
// functions the UI can call directly or wrap in useEffect /
// custom hooks.
// ============================================================

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../../../firebase/firebase';


// ─────────────────────────────────────────────────────────────
// 1. PLANTS  (master catalog – read-only from the UI)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch ALL plants from the master catalog.
 *
 * @returns {Promise<PlantDoc[]>}
 *
 * PlantDoc shape (matches Firestore schema):
 * {
 *   id:                 string,
 *   name:               string,
 *   scientificName:     string,
 *   description:        string,
 *   imageUrl:           string,
 *   sunlight:           string,
 *   wateringFrequency:  number,
 *   fertilizerFrequency:number,
 *   growthDays:         number,
 *   pests:              string[],
 *   diseases:           string[],
 *   createdAt:          Timestamp,
 * }
 */
export async function fetchAllPlants() {
  const q = query(
    collection(db, 'plants'),
    orderBy('name', 'asc'),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch a single plant from the master catalog by its ID.
 *
 * @param {string} plantId
 * @returns {Promise<PlantDoc|null>}
 */
export async function fetchPlantById(plantId) {
  const snap = await getDoc(doc(db, 'plants', plantId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


// ─────────────────────────────────────────────────────────────
// 2. USER PLANTS  (for "Add to Garden" / "Already Added" state)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all userPlants for a given user.
 * Used to determine which catalog plants are already in the garden.
 *
 * @param {string} userId
 * @returns {Promise<UserPlantDoc[]>}
 *
 * UserPlantDoc shape (matches Firestore schema):
 * {
 *   id:           string,   // userPlantId
 *   userId:       string,
 *   plantId:      string,   // reference back to plants collection
 *   nickname:     string,
 *   plantedDate:  Timestamp,
 *   currentStage: string,
 *   imageUrl:     string,
 *   createdAt:    Timestamp,
 * }
 */
export async function fetchUserPlantsByUser(userId) {
  const q = query(
    collection(db, 'userPlants'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Build a Set of plantIds (catalog IDs) already in the user's garden.
 * Handy for O(1) "is this plant already added?" checks in the UI.
 *
 * @param {string} userId
 * @returns {Promise<Set<string>>}
 */
export async function fetchAddedPlantIdSet(userId) {
  const userPlants = await fetchUserPlantsByUser(userId);
  return new Set(userPlants.map((up) => up.plantId));
}

/**
 * Find the userPlant document for a specific (userId, plantId) pair.
 * Returns null when the plant is not in the garden yet.
 *
 * @param {string} userId
 * @param {string} plantId
 * @returns {Promise<UserPlantDoc|null>}
 */
export async function findUserPlant(userId, plantId) {
  const q = query(
    collection(db, 'userPlants'),
    where('userId',  '==', userId),
    where('plantId', '==', plantId),
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}


// ─────────────────────────────────────────────────────────────
// 3. ADD / REMOVE FROM GARDEN
// ─────────────────────────────────────────────────────────────

/**
 * Add a catalog plant to the user's garden (creates a userPlant doc).
 * Uses the plant's catalog imageUrl as the default photo.
 *
 * @param {string}   userId
 * @param {PlantDoc} plant   – full plant document from fetchAllPlants()
 * @returns {Promise<string>} – new userPlantId
 */
export async function addPlantToGarden(userId, plant) {
  const docRef = await addDoc(collection(db, 'userPlants'), {
    userId,
    plantId:      plant.id,
    nickname:     plant.name,
    plantedDate:  Timestamp.now(),
    currentStage: 'Early Growth',
    imageUrl:     plant.imageUrl ?? '',
    createdAt:    Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Remove a plant from the user's garden by its userPlantId.
 *
 * @param {string} userPlantId
 * @returns {Promise<void>}
 */
export async function removePlantFromGarden(userPlantId) {
  await deleteDoc(doc(db, 'userPlants', userPlantId));
}

/**
 * Toggle a plant in/out of the garden.
 * - If the plant is NOT in the garden  → adds it, returns { added: true,  userPlantId }
 * - If the plant IS already in garden  → removes it, returns { added: false, userPlantId }
 *
 * @param {string}   userId
 * @param {PlantDoc} plant
 * @returns {Promise<{ added: boolean, userPlantId: string }>}
 */
export async function togglePlantInGarden(userId, plant) {
  const existing = await findUserPlant(userId, plant.id);

  if (existing) {
    await removePlantFromGarden(existing.id);
    return { added: false, userPlantId: existing.id };
  }

  const newId = await addPlantToGarden(userId, plant);
  return { added: true, userPlantId: newId };
}


// ─────────────────────────────────────────────────────────────
// 4. CATEGORY HELPERS  (derived from catalog data – no extra reads)
// ─────────────────────────────────────────────────────────────

/**
 * Map a plant's sunlight field to a human-readable category label.
 * You can expand this lookup as new plants are added to the catalog.
 *
 * @param {string} sunlight  – raw value from Firestore
 * @returns {string}
 */
export function sunlightLabel(sunlight = '') {
  const map = {
    full:     'Full Sun',
    partial:  'Partial Shade',
    indirect: 'Indirect Sun',
    direct:   'Direct Sun',
    low:      'Low Light',
    shade:    'Deep Shade',
  };
  const key = sunlight.toLowerCase().trim();
  return map[key] ?? sunlight;
}

/**
 * Derive a care-level string from wateringFrequency.
 * Thresholds are intentionally simple and easy to tweak.
 *
 * @param {number} wateringFrequency  – days between watering
 * @returns {'Easy Care' | 'Moderate' | 'High Maintenance'}
 */
export function careLevel(wateringFrequency = 7) {
  if (!wateringFrequency || wateringFrequency === 0) return 'Unknown';
  if (wateringFrequency >= 10) return 'Easy Care';
  if (wateringFrequency >= 5)  return 'Moderate';
  return 'High Maintenance';
}
/**
 * Infer a UI category from available plant fields.
 * Falls back to 'Other' when nothing matches.
 *
 * @param {PlantDoc} plant
 * @returns {string}
 */
export function inferCategory(plant) {
  const name = (plant.name ?? '').toLowerCase();
  const desc = (plant.description ?? '').toLowerCase();

  if (/basil|mint|rosemary|thyme|oregano|cilantro|parsley/.test(name)) return 'Herbs';
  if (/tomato|pepper|eggplant|squash|cucumber|carrot|lettuce|spinach|cabbage/.test(name)) return 'Vegetables';
  if (/aloe|cactus|succulent|echeveria|haworthia|sedum/.test(name)) return 'Succulents';
  if (/rose|lavender|sunflower|orchid|jasmine|lily|chrysanthemum|tulip/.test(name)) return 'Flowering';
  if (/monstera|pothos|fern|palm|philodendron|snake|dracaena|calathea|rubber/.test(name)) return 'Foliage';
  if (/mango|banana|citrus|lemon|orange|guava|papaya|avocado/.test(name)) return 'Fruit Trees';
  if (desc.includes('herb')) return 'Herbs';
  if (desc.includes('vegetable')) return 'Vegetables';
  if (desc.includes('flower') || desc.includes('bloom')) return 'Flowering';
  return 'Other';
}


// ─────────────────────────────────────────────────────────────
// 5. AGGREGATE – single call that loads everything the directory needs
// ─────────────────────────────────────────────────────────────

export async function loadDirectoryData(userId) {
  const [plants, addedPlantIds] = await Promise.all([
    fetchAllPlants(),
    userId ? fetchAddedPlantIdSet(userId) : Promise.resolve(new Set()),
  ]);

  return { plants, addedPlantIds };
}

export async function findPlantByName(name) {
  const q = query(
    collection(db, 'plants'),
    where('name', '==', name),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function addPlantToCatalog(data) {
  const docRef = await addDoc(collection(db, 'plants'), {
    name:                data.name,
    scientificName:      data.scientificName ?? '',
    description:         data.description ?? '',
    imageUrl:            data.imageUrl ?? '',
    sunlight:            data.sunlight ?? '',
    wateringFrequency:   data.wateringFrequency ?? 0,
    fertilizerFrequency: data.fertilizerFrequency ?? 0,
    growthDays:          data.growthDays ?? 0,
    pests:               data.pests ?? [],
    diseases:            data.diseases ?? [],
    createdAt:           Timestamp.now(),
  });
  return docRef.id;
}