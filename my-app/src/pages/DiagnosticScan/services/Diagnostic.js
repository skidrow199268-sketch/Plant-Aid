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

// ── REMOVED: ref, uploadBytes, getDownloadURL, storage ──────
import { db } from '../../../firebase/firebase';

const PLANT_ID_API_KEY = import.meta.env.VITE_PLANT_ID_API_KEY;
const PLANT_ID_URL     = 'https://api.plant.id/v3/identification?details=common_names&language=en';




// ─────────────────────────────────────────────────────────────
// 1. CONVERT FILE → BASE64
// ─────────────────────────────────────────────────────────────

/**
 * Convert a File or Blob to a base64 string (no data: prefix).
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Plant.id v3 requires the full data URI including the prefix
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── REMOVED: uploadScanImage() — Firebase Storage no longer used ──


// ─────────────────────────────────────────────────────────────
// 2. CALL PLANT.ID API v3
// ─────────────────────────────────────────────────────────────

/**
 * Identify a plant from one or more image files using Plant.id API v3.
 * Sends image(s) as base64 directly — no Storage upload needed.
 * Passing multiple images (different angles: leaf, flower, bark)
 * generally improves identification accuracy.
 *
 * @param {File|File[]} files          – single file OR array of files (3-9 recommended)
 * @param {object} [options]
 * @param {string} [options.organ]     – 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto'
 * @param {number} [options.latitude]
 * @param {number} [options.longitude]
 * @returns {Promise<PlantIdResult>}
 *
 * PlantIdResult shape:
 * {
 *   isPlant:        boolean,
 *   isPlantScore:   number,        // 0–1
 *   isHealthy:      boolean,
 *   isHealthyScore: number,        // 0–1
 *   suggestions: [{
 *     name:        string,
 *     commonNames: string[],
 *     probability: number,
 *     wikiUrl:     string,
 *     imageUrl:    string,
 *     description: string,
 *   }],
 *   diseases: [{
 *     name:        string,
 *     probability: number,
 *     description: string,
 *     commonNames: string[],
 *   }],
 *   rawResponse: object,
 * }
 */



async function convertToJpeg(file, quality = 0.8, maxDimension = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }
          const jpegFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );
          resolve(jpegFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function fileToPlantIdBase64(file) {

   const jpegFile = await convertToJpeg(file, 0.8)

      console.log('ORIGINAL TYPE:', file.type);
console.log('UPLOAD TYPE:', jpegFile.type);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Invalid file result'));
        return;
      }

      resolve(result.split(',')[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(jpegFile);
  });
}


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

  // NEW: normalize single File or File[] into an array
  const fileArray = Array.isArray(files) ? files : [files];

  if (!fileArray.length || !fileArray[0]) {
    throw new Error('No file provided');
  }

  // ✅ FORCE proper base64 conversion for every image
  const base64Array = await Promise.all(fileArray.map((f) => fileToPlantIdBase64(f)));

  console.log('FILE COUNT:', fileArray.length);
  console.log('BASE64 LENGTHS:', base64Array.map((b) => b.length));

const body = {
  images: base64Array,
  similar_images: true,
  health: 'all',

  classification_level: 'species',
};

console.log('REQUEST BODY IMAGE COUNT:', body.images.length);
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

/**
 * Save a scan result to identificationHistory.
 * imageUrl parameter removed — no Storage upload.
 *
 * Firestore document shape:
 * {
 *   userId, commonName, scientificName, confidence,
 *   isPlant, isPlantScore, isHealthy, healthScore,
 *   detectedDisease, diseaseProbability, diseaseDescription,
 *   scannedAt
 * }
 *
 * @param {string}        userId
 * @param {PlantIdResult} result
 * @returns {Promise<string>}  – new scanId
 */
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

/**
 * Fetch recent scan history for a user.
 *
 * @param {string} userId
 * @param {number} [maxItems=10]
 * @returns {Promise<ScanDoc[]>}
 */
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

/**
 * Run the full scan pipeline:
 *   1. Call Plant.id API with base64 image(s) directly
 *   2. Save result to Firestore (if it's a plant)
 *
 * CHANGED: imageFileOrFiles can now be a single File or a File[]
 * (3-9 photos) for a more accurate multi-angle identification.
 * CHANGED: No longer uploads to Firebase Storage.
 * CHANGED: Returns localPreviewUrl instead of a Storage imageUrl.
 *          The frontend should pass the local object URL as preview.
 *
 * @param {string}        userId
 * @param {File|File[]}   imageFileOrFiles
 * @param {object}        [options]         – passed to identifyPlant()
 * @returns {Promise<{ scanId: string|null, result: PlantIdResult }>}
 */
export async function runScanPipeline(userId, imageFileOrFiles, options = {}) {
  const result = await identifyPlant(imageFileOrFiles, options);

  // Step 2 — save to Firestore only if it's actually a plant
  let scanId = null;
  if (result.isPlant) {
    scanId = await saveScanResult(userId, result);
  }

  // imageUrl is no longer returned — frontend uses its local preview
  return { scanId, result };
}


// ─────────────────────────────────────────────────────────────
// 6. HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Format a confidence score (0–1) as a percentage string.
 * e.g. 0.923 → "92.3%"
 */
export function formatConfidence(probability) {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Get a health status label + Tailwind color config.
 */
export function getHealthConfig(isHealthy, score = 1) {
  if (isHealthy && score >= 0.7) {
    return { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (score >= 0.4) {
    return { label: 'Warning', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   };
  }
  return   { label: 'Sick',    bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     };
}