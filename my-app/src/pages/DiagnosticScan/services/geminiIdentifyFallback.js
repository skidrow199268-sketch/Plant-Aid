// ============================================================
// geminiIdentifyFallback.js
// Gemini FREE fallback plant identification.
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
// ============================================================

import { fileToPlantIdBase64 } from '../utils/fileToPlantIdBase64';
import { callGeminiApi } from './PlantAnalysis';

const IDENTIFICATION_PROMPT = `
You are a plant identification expert for plants found in the Philippines.

Analyze the attached plant image(s) and identify the most likely plant.

Rules:
- Prefer plants commonly found or cultivated in the Philippines when the visual evidence supports that.
- Do not invent a species when the image does not provide enough evidence.
- Do not fabricate scientific names or characteristics that are not visible.
- If the image does not show a plant, is an unrelated object, or is too ambiguous, return identified: false.
- Never claim certainty when the image is ambiguous. Prefer an unknown/uncertain answer over a false identification.

Return STRICT JSON only. No markdown, no code fences, no text outside the JSON.

{
  "identified": true,
  "commonName": "Lagundi",
  "scientificName": "Vitex negundo",
  "category": "Herbal / Medicinal",
  "confidence": 0.87,
  "reason": "The leaf shape and overall plant structure are consistent with lagundi.",
  "source": "gemini"
}

Field rules:
- "identified": true only when the plant is reasonably identifiable, otherwise false.
- "commonName": the common name (Filipino/local name if known, otherwise English); null when unidentified.
- "scientificName": only when reasonably identifiable; null when unsure.
- "category": exactly one of: "Herbal / Medicinal" | "Ornamental" | "Crop / Food Plant" | "Tree / Fruit Plant" | "Other" | "Unknown".
- "confidence": a number from 0 to 1 based only on visible evidence.
- "reason": a short explanation based on visible characteristics; clearly indicate when identification is uncertain.
- "source": always "gemini".
- If confidence would be below 0.5, instead return:
  {
    "identified": false,
    "commonName": null,
    "scientificName": null,
    "category": "Unknown",
    "confidence": 0,
    "reason": "The image does not provide enough visual evidence for a reliable identification.",
    "source": "gemini"
  }

Return ONLY the JSON object.
`.trim();

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
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

  return {
    isPlant:      usable,
    isPlantScore: usable ? confidence : 0,

    // Identification-only fallback: no health assessment is made,
    // so neutral values keep the existing Health tab honest.
    isHealthy:     false,
    isHealthyScore: 0.5,

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

    diseases: [],

    source: 'gemini',
    rawResponse: parsed,
  };
}

export async function identifyPlantWithGeminiFallback(files) {
  const fileArray = Array.isArray(files) ? files : [files];

  if (!fileArray.length || !fileArray[0]) {
    throw new Error('No file provided');
  }

  const imageParts = await Promise.all(
    fileArray.map(async (file) => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: await fileToPlantIdBase64(file),
      },
    })),
  );

  const parsed    = await callGeminiApi(IDENTIFICATION_PROMPT, imageParts);
  const normalized = normalizeGeminiIdentification(parsed);

  console.warn(
    '[Gemini fallback] identification result:',
    normalized.isPlant
      ? `${normalized.suggestions[0].commonNames[0]} (${normalized.suggestions[0].name}) — ${normalized.suggestions[0].probability}`
      : `unidentified — ${parsed?.reason ?? 'no reason returned'}`,
  );

  return normalized;
}
