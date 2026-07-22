// PlantAnalysisService.js
// Gemini API integration for deep botanical analysis.
// Called AFTER Plant.id identifies the plant.
// Saves results to the new `plantAnalysis` Firestore collection.

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import {buildGeminiPrompt} from './buildGeminiPrompt'
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';

import {GEMINI_MODELS} from '../constant/gemeni_model'




// ─────────────────────────────────────────────────────────────
// 2. CALL GEMINI API  (with model rotation on 429)
// ─────────────────────────────────────────────────────────────


async function tryModel(model, prompt) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (response.status === 429 || response.status === 404) {
    console.warn(`[PlantAnalysis] ${response.status} on model "${model}" — trying next model...`);
    const err    = new Error(`${response.status} on ${model}`);
    err.is429    = true; // reuse flag for any skippable error
    err.model    = model;
    throw err;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Invalid Gemini API key. Check VITE_GEMINI_API_KEY.');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${model}): ${response.status} — ${errText}`);
  }

  const data    = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  console.log(`[PlantAnalysis] ✓ Model "${model}" responded. Preview:`, rawText.slice(0, 120));

const cleaned = rawText
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/\s*```$/i, '')
  .replace(/,(\s*[}\]])/g, '$1')
  .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[PlantAnalysis] JSON parse error. Raw text:', rawText);
    throw new Error('Gemini returned invalid JSON. Try scanning again.');
  }
}


async function callGeminiApi(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('[PlantAnalysis] VITE_GEMINI_API_KEY is not set in your .env file.');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const result = await tryModel(model, prompt);
      console.log(`[PlantAnalysis] Successfully used model: "${model}"`);
      return result;
    } catch (err) {
      if (err.is429) {
        lastError = err;
        continue; 
      }
      throw err; 
    }
  }

 
  throw new Error(
    'All Gemini models are unavailable right now. Please wait a minute and try again.\n' +
    `Last error: ${lastError?.message}`
  );
}


// ─────────────────────────────────────────────────────────────
// 3. SAVE TO FIRESTORE  (plantAnalysis collection)
// ─────────────────────────────────────────────────────────────

export async function savePlantAnalysis(userId, scanId, commonName, scientificName, analysis) {
  const docRef = await addDoc(collection(db, 'plantAnalysis'), {
    userId,
    scanId,
    commonName,
    scientificName,

    overview:           analysis.overview           ?? '',

    plantType:          analysis.plantType           ?? 'Unknown',
    category:            analysis.category            ?? 'Unknown',
    family:              analysis.family              ?? 'Unknown',
    genus:                analysis.genus                ?? 'Unknown',

    careDifficulty:     analysis.careDifficulty     ?? 'Moderate',
    gardeningMethod:    analysis.gardeningMethod    ?? '',
    wateringGuide:      analysis.wateringGuide      ?? {},
    sunlightGuide:      analysis.sunlightGuide      ?? {},
    soilGuide:          analysis.soilGuide          ?? {},
    fertilizingGuide:   analysis.fertilizingGuide   ?? {},
    commonPests:        analysis.commonPests        ?? [],
    pestControl:        analysis.pestControl        ?? '',
    diseaseManagement:  analysis.diseaseManagement  ?? '',
    propagationMethods: analysis.propagationMethods ?? [],
    growthTimeline:     analysis.growthTimeline     ?? {},
    harvestTips:        analysis.harvestTips        ?? null,
    companionPlants:    analysis.companionPlants    ?? [],
    toxicity:           analysis.toxicity           ?? { istoxic: false, toxicTo: [], details: null },
    climateSuitability: analysis.climateSuitability ?? '',
    quickTips:          analysis.quickTips          ?? [],

    createdAt: serverTimestamp(),
  });

  return docRef.id;
}


// ─────────────────────────────────────────────────────────────
// 4. FETCH ANALYSIS
// ─────────────────────────────────────────────────────────────

export async function fetchAnalysisByScanId(scanId) {
  const q = query(
    collection(db, 'plantAnalysis'),
    where('scanId', '==', scanId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function fetchRecentAnalyses(userId, maxItems = 5) {
  const q = query(
    collection(db, 'plantAnalysis'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


export async function fetchAnalysisById(analysisId) {
  const snap = await getDoc(doc(db, 'plantAnalysis', analysisId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


// ─────────────────────────────────────────────────────────────
// 5. FULL ANALYSIS PIPELINE
// ─────────────────────────────────────────────────────────────


export async function runAnalysisPipeline(userId, scanId, plantIdResult) {
  const top            = plantIdResult.suggestions?.[0];
  const commonName     = top?.commonNames?.[0] || top?.name || 'Unknown Plant';
  const scientificName = top?.name || '';

  const prompt = buildGeminiPrompt(plantIdResult);

  const analysis = await callGeminiApi(prompt);
  if (top?.taxonomy) {
    if (!analysis.family || analysis.family === 'Unknown') analysis.family = top.taxonomy.family || 'Unknown';
    if (!analysis.genus  || analysis.genus  === 'Unknown') analysis.genus  = top.taxonomy.genus  || 'Unknown';
  }

  const analysisId = await savePlantAnalysis(
    userId,
    scanId ?? '',
    commonName,
    scientificName,
    analysis,
  );

  return { analysisId, analysis };
}




export function getDifficultyConfig(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Advanced':
      return { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     };
    default:
      return { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   };
  }
}