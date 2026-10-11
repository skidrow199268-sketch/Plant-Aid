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
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';


import { db } from '../../../firebase/firebase';
import {fileToPlantIdBase64} from '../utils/fileToPlantIdBase64'
import { identifyPlantWithGeminiFallback, assessPlantHealthWithGemini } from './geminiIdentifyFallback';
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

    // Keep the raw probability only when Plant.id actually evaluated health.
    // A missing value must stay null so the UI can show a neutral
    // "not assessed" state instead of inventing a 0 / 50% verdict.
    isHealthyScore:
      typeof result?.is_healthy?.probability === 'number'
        ? result.is_healthy.probability
        : null,
    healthAssessed: typeof result?.is_healthy?.probability === 'number',

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

    source: 'plant.id',
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


function hasUsableIdentification(result) {
  const top = result?.suggestions?.[0];
  return (
    Array.isArray(result?.suggestions) &&
    result.suggestions.length > 0 &&
    typeof top?.name === 'string' &&
    top.name.length > 0 &&
    top.name !== 'Unknown'
  );
}


// ─────────────────────────────────────────────────────────────
// Health-first reconciliation
//
// Plant.id can return a high overall healthy probability AND a
// per-condition suggestion (e.g. a cosmetic spot on one leaf) at the
// same time. Trusting the condition alone produced the contradictory
// "85% healthy + Detected Condition: Leaf necrosis 90%".
//
// Rules:
//   1. The overall health verdict drives everything. A plant judged
//      healthy never shows "Detected Conditions".
//   2. When the model is unsure (ambiguous band) lean healthy — never
//      show a plant as borderline-sick on minor evidence (product rule:
//      60% healthy or higher).
//   3. A condition only counts when the plant is unhealthy AND the
//      condition itself is reasonably probable.
// ─────────────────────────────────────────────────────────────
const HEALTHY_SCORE_GATE = 0.6;       // >= this ⇒ Healthy, hide conditions
const UNCERTAIN_BAND_MIN = 0.4;       // [0.4, 0.6) ⇒ lean healthy up to 0.6
const MIN_CONDITION_PROBABILITY = 0.5; // ignore weaker condition suggestions

export function reconcileHealthResult(result) {
  if (!result || !result.healthAssessed || result.isHealthyScore == null) {
    return result;
  }

  let score = Number(result.isHealthyScore);
  if (!Number.isFinite(score)) return result;

  // Lean healthy when the model is unsure.
  if (score >= UNCERTAIN_BAND_MIN && score < HEALTHY_SCORE_GATE) {
    score = HEALTHY_SCORE_GATE;
  }

  const isHealthy = score >= HEALTHY_SCORE_GATE;

  // A healthy plant carries no "detected conditions".
  const diseases = isHealthy
    ? []
    : (result.diseases ?? []).filter(
        (d) => Number(d?.probability ?? 0) >= MIN_CONDITION_PROBABILITY,
      );

  return { ...result, isHealthy, isHealthyScore: score, diseases };
}


export async function runScanPipeline(userId, imageFileOrFiles, options = {}) {
  const fileArray = Array.isArray(imageFileOrFiles) ? imageFileOrFiles : [imageFileOrFiles];

  if (!fileArray.length || !fileArray[0]) {
    throw new Error('No file provided');
  }

  let result = null;
  let plantIdError = null;

  // Step 1 — Plant.id (primary provider, unchanged)
  try {
    result = await identifyPlant(imageFileOrFiles, options);
  } catch (err) {
    plantIdError = err;
    console.error('[Diagnostic] Plant.id identification failed:', err?.message ?? err);
  }

  // Step 1b — Gemini FREE fallback, only on a genuine Plant.id failure
  //           (quota/billing/rate-limit/network/HTTP/JSON) or an empty,
  //           unusable Plant.id identification.
  if (plantIdError) {
    console.warn('[Diagnostic] Trying Gemini FREE fallback identification...');
    try {
      result = await identifyPlantWithGeminiFallback(fileArray);
      console.warn('[Diagnostic] Gemini fallback identification used.');
    } catch (geminiErr) {
      console.error('[Diagnostic] Gemini fallback failed:', geminiErr?.message ?? geminiErr);
      throw new Error(
        `${plantIdError.message} — Gemini fallback also failed: ${geminiErr.message}`,
        { cause: geminiErr },
      );
    }
  } else if (!hasUsableIdentification(result)) {
    console.warn('[Diagnostic] Plant.id returned an unusable identification — trying Gemini FREE fallback...');
    try {
      result = await identifyPlantWithGeminiFallback(fileArray);
      console.warn('[Diagnostic] Gemini fallback identification used.');
    } catch (geminiErr) {
      console.warn('[Diagnostic] Gemini fallback failed — keeping Plant.id response:', geminiErr?.message ?? geminiErr);
    }
  }

  // Step 1b — Health backfill: if identification succeeded (e.g. via Plant.id)
  //           but no health assessment came back, ask Gemini once for a
  //           visible health check so the Health tab still works. Skipped when
  //           the Gemini fallback already assessed health (no double call).
  if (result.isPlant && !result.healthAssessed && result.source !== 'gemini') {
    try {
      const health = await assessPlantHealthWithGemini(fileArray);
      if (health.healthAssessed) {
        result = { ...result, ...health };
        console.warn('[Diagnostic] Gemini health backfill used.');
      }
    } catch (healthErr) {
      console.warn('[Diagnostic] Gemini health backfill failed:', healthErr?.message ?? healthErr);
    }
  }

  // Step 1c — Reconcile health with the detected conditions so a high healthy
  //           probability never coexists with "Detected Conditions".
  result = reconcileHealthResult(result);

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
  if (probability === null || probability === undefined) return '—';
  const value = Number(probability);
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}


// Shared visual states for the health badge. `assessed` is added by
// getHealthConfig() and lets callers tell a real verdict apart from
// "we never checked" (e.g. the identification-only Gemini fallback).
const HEALTH_STATES = {
  healthy: { label: 'Healthy',      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { label: 'Warning',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  sick:    { label: 'Sick',         bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
  unknown: { label: 'Not assessed', bg: 'bg-[#f4f2fd]',  text: 'text-[#47464a]',   border: 'border-[#c8c5ca]'   },
};

export function getHealthConfig(isHealthy, score = null, options = {}) {
  const { assessed = true, diseaseCount } = options;
  const hasScore =
    score !== null && score !== undefined && Number.isFinite(Number(score));

  // Health was never evaluated (identification-only result). Never invent a
  // verdict that contradicts the "No issues detected" empty state.
  if (!assessed || !hasScore) {
    return { ...HEALTH_STATES.unknown, assessed: false };
  }

  const value = Number(score);

  // Conditions were detected → reflect severity.
  if (typeof diseaseCount === 'number' && diseaseCount > 0) {
    return {
      ...(isHealthy || value >= 0.4 ? HEALTH_STATES.warning : HEALTH_STATES.sick),
      assessed: true,
    };
  }

  // No conditions detected → nothing to warn about. A borderline or low
  // health probability on its own must not contradict "No issues detected".
  if (typeof diseaseCount === 'number') {
    return { ...HEALTH_STATES.healthy, assessed: true };
  }

  // Legacy callers that pass only a score keep the original thresholds.
  if (isHealthy && value >= 0.7) return { ...HEALTH_STATES.healthy, assessed: true };
  if (value >= 0.4)              return { ...HEALTH_STATES.warning, assessed: true };
  return { ...HEALTH_STATES.sick, assessed: true };
}