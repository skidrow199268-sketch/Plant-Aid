// ============================================================
// DiagnosticScanService.js
// Data layer for the Diagnostic Scan screen.
// Uses Plant.id API v3 for identification + health assessment.
// Firebase Storage removed — images sent directly as base64.
// Results saved to identificationHistory Firestore collection.
//
// CHANGED: identifyPlant() / runScanPipeline() now accept either
// a single File or an array of Files (3-9 photos for a more
// accurate multi-angle scan). Single-file callers are unaffected.
//
// CHANGED (classification feature): request `taxonomy` in the
// Plant.id `details` param and expose it per-suggestion so it can
// be used as a hint/fallback for plant classification.
// ============================================================

import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';


import { db } from '../../../firebase/firebase';
import {fileToPlantIdBase64} from '../utils/fileToPlantIdBase64'
const PLANT_ID_API_KEY = import.meta.env.VITE_PLANT_ID_API_KEY;
const PLANT_ID_URL     = 'https://api.plant.id/v3/identification?details=common_names,taxonomy&language=en';




// ─────────────────────────────────────────────────────────────
// 1. CONVERT FILE → BASE64
// ─────────────────────────────────────────────────────────────


export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}



// ─────────────────────────────────────────────────────────────
// 2. CALL PLANT.ID API v3
// ─────────────────────────────────────────────────────────────





function normalizePlantIdResponse(raw) {
  const result = raw?.result || {};

  return {
    isPlant: result?.is_plant?.binary ?? false,
    isPlantScore: result?.is_plant?.probability ?? 0,

    isHealthy: result?.is_healthy?.binary ?? false,
    isHealthyScore: result?.is_healthy?.probability ?? 0,

    suggestions:
  result?.classification?.suggestions?.map((item) => ({
    name: item?.name ?? 'Unknown',
    commonNames: item?.details?.common_names ?? [],
    probability: item?.probability ?? 0,
    wikiUrl: item?.details?.url ?? '',
    imageUrl: item?.similar_images?.[0]?.url ?? '',
    description:
      item?.details?.description ??
      item?.details?.wiki_description?.value ??
      '',
    taxonomy: item?.details?.taxonomy
      ? {
          genus:   item.details.taxonomy.genus   ?? '',
          family:  item.details.taxonomy.family  ?? '',
          order:   item.details.taxonomy.order   ?? '',
          class:   item.details.taxonomy.class   ?? '',
          phylum:  item.details.taxonomy.phylum  ?? '',
          kingdom: item.details.taxonomy.kingdom ?? '',
        }
      : null,
  })) ?? [],

    diseases:
      result?.disease?.suggestions?.map((item) => ({
        name: item?.name ?? 'Unknown Disease',
        probability: item?.probability ?? 0,
        description:
          item?.details?.description ??
          item?.details?.treatment?.chemical ??
          '',
        commonNames: item?.details?.common_names ?? [],
      })) ?? [],

    rawResponse: raw,
  };
}




export async function identifyPlant(files, { organ = 'auto', latitude, longitude } = {}) {
  if (!PLANT_ID_API_KEY) {
    throw new Error('[DiagnosticScan] VITE_PLANT_ID_API_KEY is not set in your .env file.');
  }


  const fileArray = Array.isArray(files) ? files : [files];

  if (!fileArray.length || !fileArray[0]) {
    throw new Error('No file provided');
  }

  const base64Array = await Promise.all(fileArray.map((f) => fileToPlantIdBase64(f)));


const body = {
  images: base64Array,
  similar_images: true,
  health: 'all',

  classification_level: 'species',
};


  if (organ && organ !== 'auto') body.organs = [organ];
  if (latitude !== undefined) body.latitude = latitude;
  if (longitude !== undefined) body.longitude = longitude;
 


const response = await fetch(PLANT_ID_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': PLANT_ID_API_KEY,
  },
  body: JSON.stringify(body),
});


  const text = await response.text();

  if (!response.ok) {
    console.error('[Plant.id RAW ERROR]:', text);
    throw new Error(`Plant.id API error: ${response.status} — ${text}`);
  }

const raw = JSON.parse(text);

const normalized = normalizePlantIdResponse(raw);


return normalized;
}
// ─────────────────────────────────────────────────────────────
// 3. SAVE TO FIRESTORE  (identificationHistory)
// ─────────────────────────────────────────────────────────────

export async function saveScanResult(userId, result) {
  const topSuggestion = result.suggestions?.[0] ?? null;
  const topDisease    = result.diseases?.[0]    ?? null;

  const docRef = await addDoc(collection(db, 'identificationHistory'), {
    userId,

    commonName:
      topSuggestion?.commonNames?.[0] ??
      topSuggestion?.name             ??
      'Unknown Plant',

    scientificName:
      topSuggestion?.name ?? '',

    confidence:
      Math.round((topSuggestion?.probability ?? 0) * 100),

    isPlant:      result.isPlant,
    isPlantScore: result.isPlantScore,
    isHealthy:    result.isHealthy,
    healthScore:  result.isHealthyScore,

    detectedDisease:    topDisease?.name        ?? '',
    diseaseProbability: topDisease ? Math.round(topDisease.probability * 100) : 0,
    diseaseDescription: topDisease?.description ?? '',

    scannedAt: serverTimestamp(),
  });

  return docRef.id;
}


// ─────────────────────────────────────────────────────────────
// 4. FETCH SCAN HISTORY
// ─────────────────────────────────────────────────────────────


export async function fetchScanHistory(userId, maxItems = 10) {
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
// 5. FULL SCAN PIPELINE  (no Storage upload)
// ─────────────────────────────────────────────────────────────


export async function runScanPipeline(userId, imageFileOrFiles, options = {}) {
  const result = await identifyPlant(imageFileOrFiles, options);

  // Step 2 — save to Firestore only if it's actually a plant
  let scanId = null;
  if (result.isPlant) {
    scanId = await saveScanResult(userId, result);
  }


  return { scanId, result };
}


// ─────────────────────────────────────────────────────────────
// 6. HELPERS
// ─────────────────────────────────────────────────────────────


export function formatConfidence(probability) {
  return `${(probability * 100).toFixed(1)}%`;
}


export function getHealthConfig(isHealthy, score = 1) {
  if (isHealthy && score >= 0.7) {
    return { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (score >= 0.4) {
    return { label: 'Warning', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   };
  }
  return   { label: 'Sick',    bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     };
}