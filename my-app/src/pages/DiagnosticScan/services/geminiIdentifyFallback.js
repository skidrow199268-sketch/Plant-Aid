// ============================================================
// geminiIdentifyFallback.js
// Gemini FREE fallback plant identification + health assessment.
//
// Runs ONLY when Plant.id fails (quota / billing / rate limit /
// network / HTTP / JSON errors) or returns an unusable, empty
// identification. Reuses the existing Gemini REST helper
// (callGeminiApi in PlantAnalysis.js) and the existing
// fileToPlantIdBase64 image util — no new API key, no new SDK.
//
// The result is mapped into the exact shape produced by
// normalizePlantIdResponse() in Diagnostic.js so the UI, the
// Firestore save and the analysis pipeline keep working unchanged.
//
// CHANGED: the fallback now also asks Gemini for a visible health
// assessment in the same call, so the Health tab keeps working even
// when Plant.id is unavailable (instead of showing "Not assessed").
// ============================================================

import { fileToPlantIdBase64 } from '../utils/fileToPlantIdBase64';
import { callGeminiApi } from './PlantAnalysis';

const IDENTIFICATION_PROMPT = `
You are a plant identification and plant-health expert for plants found in the Philippines.

Analyze the attached plant image(s): identify the most likely plant AND assess its visible health.

Identification rules:
- Prefer plants commonly found or cultivated in the Philippines when the visual evidence supports that.
- Do not invent a species when the image does not provide enough evidence.
- Do not fabricate scientific names or characteristics that are not visible.
- If the image does not show a plant, is an unrelated object, or is too ambiguous, return identified: false.
- Never claim certainty when the image is ambiguous. Prefer an unknown/uncertain answer over a false identification.

Health rules:
- Judge health ONLY from what is visible (leaf colour, spots, holes, wilting, pests, discoloration).
- Do not invent diseases that are not visible. A healthy, vigorous plant should have an empty issues list.
- If the image is too unclear to judge health, set "health": null.

Return STRICT JSON only. No markdown, no code fences, no text outside the JSON.

{
  "identified": true,
  "commonName": "Lagundi",
  "scientificName": "Vitex negundo",
  "category": "Herbal / Medicinal",
  "confidence": 0.87,
  "reason": "The leaf shape and overall plant structure are consistent with lagundi.",
  "source": "gemini",
  "health": {
    "isHealthy": true,
    "confidence": 0.82,
    "summary": "Leaves are evenly green with no visible spots or damage.",
    "issues": []
  }
}

Field rules:
- "identified": true only when the plant is reasonably identifiable, otherwise false.
- "commonName": the common name (Filipino/local name if known, otherwise English); null when unidentified.
- "scientificName": only when reasonably identifiable; null when unsure.
- "category": exactly one of: "Herbal / Medicinal" | "Ornamental" | "Crop / Food Plant" | "Tree / Fruit Plant" | "Other" | "Unknown".
- "confidence": a number from 0 to 1 based only on visible evidence.
- "reason": a short explanation based on visible characteristics; clearly indicate when identification is uncertain.
- "source": always "gemini".
- "health": null when health cannot be judged, otherwise an object:
    - "isHealthy": true when the plant looks healthy overall, false when there are visible problems.
    - "confidence": a number from 0 to 1 — your confidence in the health judgement.
    - "summary": one short sentence describing the visible health.
    - "issues": array of visible problems (empty when healthy). Each issue:
        { "name": "e.g. Leaf spot", "probability": 0 to 1, "description": "short visible evidence" }
- If identification confidence would be below 0.5, instead return:
  {
    "identified": false,
    "commonName": null,
    "scientificName": null,
    "category": "Unknown",
    "confidence": 0,
    "reason": "The image does not provide enough visual evidence for a reliable identification.",
    "source": "gemini",
    "health": null
  }

Return ONLY the JSON object.
`.trim();

// Health-only prompt used to backfill health when identification succeeded
// (e.g. Plant.id) but no health assessment was returned.
const HEALTH_PROMPT = `
You are a plant-health expert. Look at the attached plant image(s) and assess the plant's visible health.

Rules:
- Judge health ONLY from what is visible (leaf colour, spots, holes, wilting, pests, discoloration).
- Do not invent diseases that are not visible. A healthy, vigorous plant should have an empty issues list.
- If the image is too unclear to judge health, return { "health": null }.

Return STRICT JSON only. No markdown, no code fences, no text outside the JSON.

{
  "health": {
    "isHealthy": true,
    "confidence": 0.82,
    "summary": "Leaves are evenly green with no visible spots or damage.",
    "issues": []
  }
}
`.trim();

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Neutral "no health data" shape shared by every code path.
const NO_HEALTH = {
  healthAssessed: false,
  isHealthy: null,
  isHealthyScore: null,
  diseases: [],
};

/**
 * Map Gemini's `health` block into the same shape Plant.id produces so the
 * rest of the app (Health tab, Firestore save, analysis prompt) works as-is.
 */
function normalizeGeminiHealth(health) {
  if (!health || typeof health !== 'object' || Array.isArray(health)) {
    return { ...NO_HEALTH };
  }

  const score = Number.isFinite(Number(health.confidence))
    ? clamp01(health.confidence)
    : null;

  const isHealthy =
    typeof health.isHealthy === 'boolean'
      ? health.isHealthy
      : score !== null
        ? score >= 0.5
        : null;

  const issues = Array.isArray(health.issues) ? health.issues : [];
  const diseases = issues
    .map((issue) => {
      if (!issue || typeof issue !== 'object') return null;
      const name = asText(issue.name);
      if (!name) return null;
      return {
        name,
        probability: clamp01(issue.probability),
        description: asText(issue.description),
        commonNames: [],
      };
    })
    .filter(Boolean);

  // Nothing usable came back → keep the honest "not assessed" state.
  if (isHealthy === null && score === null && diseases.length === 0) {
    return { ...NO_HEALTH };
  }

  const finalScore = score !== null ? score : isHealthy ? 0.8 : 0.3;

  // An "unhealthy" verdict with no named condition would otherwise render as
  // "No issues detected" — surface the visible summary as a condition instead.
  if (!isHealthy && diseases.length === 0) {
    const summary = asText(health.summary) || 'Visible signs of stress or damage';
    diseases.push({
      name: 'General stress',
      probability: clamp01(1 - finalScore),
      description: summary,
      commonNames: [],
    });
  }

  return {
    healthAssessed: true,
    isHealthy,
    isHealthyScore: finalScore,
    diseases,
  };
}

function normalizeGeminiIdentification(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gemini returned an unexpected identification payload.');
  }

  const confidence = clamp01(parsed.confidence);
  const reason     = asText(parsed.reason);
  const category   = asText(parsed.category) || 'Unknown';

  let commonName     = asText(parsed.commonName);
  let scientificName = asText(parsed.scientificName);

  const usable = parsed.identified === true && commonName.length > 0 && confidence > 0;

  if (!usable) {
    commonName     = '';
    scientificName = '';
  }

  const health = usable
    ? normalizeGeminiHealth(parsed.health)
    : { ...NO_HEALTH };

  return {
    isPlant:      usable,
    isPlantScore: usable ? confidence : 0,

    // Health now comes from Gemini's visual assessment; when it can't judge,
    // isHealthyScore stays null so the UI shows "Not assessed".
    isHealthy:      health.isHealthy,
    isHealthyScore: health.isHealthyScore,
    healthAssessed: health.healthAssessed,

    suggestions: usable
      ? [
          {
            name:        scientificName || commonName,
            commonNames: [commonName],
            probability: confidence,
            wikiUrl:     '',
            imageUrl:    '',
            description: reason,
            category,
            taxonomy:    null,
          },
        ]
      : [],

    diseases: health.diseases,

    source: 'gemini',
    rawResponse: parsed,
  };
}

async function buildImageParts(files) {
  const fileArray = Array.isArray(files) ? files : [files];

  if (!fileArray.length || !fileArray[0]) {
    throw new Error('No file provided');
  }

  return Promise.all(
    fileArray.map(async (file) => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: await fileToPlantIdBase64(file),
      },
    })),
  );
}

export async function identifyPlantWithGeminiFallback(files) {
  const imageParts = await buildImageParts(files);

  const parsed     = await callGeminiApi(IDENTIFICATION_PROMPT, imageParts);
  const normalized = normalizeGeminiIdentification(parsed);

  console.warn(
    '[Gemini fallback] identification result:',
    normalized.isPlant
      ? `${normalized.suggestions[0].commonNames[0]} (${normalized.suggestions[0].name}) — ${normalized.suggestions[0].probability}`
      : `unidentified — ${parsed?.reason ?? 'no reason returned'}`,
    normalized.healthAssessed
      ? `| health: ${normalized.isHealthy ? 'healthy' : 'issues detected'} (${normalized.isHealthyScore})`
      : '| health: not assessed',
  );

  return normalized;
}

/**
 * Health-only Gemini assessment, used to backfill health when identification
 * succeeded (e.g. via Plant.id) but no health data was returned.
 * @returns {Promise<{ healthAssessed: boolean, isHealthy: boolean|null, isHealthyScore: number|null, diseases: Array }>}
 */
export async function assessPlantHealthWithGemini(files) {
  const imageParts = await buildImageParts(files);

  const parsed = await callGeminiApi(HEALTH_PROMPT, imageParts);
  const health = normalizeGeminiHealth(parsed?.health);

  console.warn(
    '[Gemini fallback] health assessment:',
    health.healthAssessed
      ? `${health.isHealthy ? 'healthy' : 'issues detected'} (${health.isHealthyScore})`
      : 'not assessed',
  );

  return health;
}
