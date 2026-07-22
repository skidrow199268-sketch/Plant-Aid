export function buildGeminiPrompt(plantIdResult) {
  const top        = plantIdResult.suggestions?.[0];
  const commonName = top?.commonNames?.[0] || top?.name || 'Unknown Plant';
  const sciName    = top?.name || '';
  const isHealthy  = plantIdResult.isHealthy;
  const diseases   = plantIdResult.diseases?.map((d) => d.name).join(', ') || 'none detected';

  const taxonomy = top?.taxonomy;
  const taxonomyHint = taxonomy
    ? `- Known taxonomy (from Plant.id, treat as authoritative if present): family="${taxonomy.family || 'unknown'}", genus="${taxonomy.genus || 'unknown'}", order="${taxonomy.order || 'unknown'}"`
    : '- No taxonomy data available from Plant.id — infer family and genus from the species name yourself.';

  return `
You are an expert botanist and horticulturist. A plant has been identified with the following details:

- Common Name: ${commonName}
- Scientific Name: ${sciName}
- Health Status: ${isHealthy ? 'Healthy' : 'Unhealthy / Diseased'}
- Detected Conditions / Diseases: ${diseases}
${taxonomyHint}

Provide a comprehensive botanical analysis in STRICT JSON format. Do NOT include markdown, code blocks, or any text outside the JSON. Return ONLY this JSON object:

{
  "overview": "2-3 sentence description of this plant, its origin, and characteristics",
  "plantType": "one of: Tree | Herb | Shrub | Vine | Grass | Succulent | Fern | Palm | Other",
  "category": "one of: Fruit Plant | Vegetable Plant | Ornamental Plant | Medicinal Plant | Crop | Houseplant | Other",
  "family": "botanical family name, e.g. Solanaceae",
  "genus": "botanical genus name, e.g. Solanum",
  "careDifficulty": "Easy" | "Moderate" | "Advanced",
  "gardeningMethod": "one of: Container Gardening | Raised Bed | In-Ground | Hydroponic | Aquaponic | Vertical Garden | Greenhouse | Indoor | Balcony Garden",
  "wateringGuide": {
    "frequency": "e.g. Every 7 days",
    "amount": "e.g. Water until soil is moist 2 inches deep",
    "tips": "1-2 specific watering tips for this plant"
  },
  "sunlightGuide": {
    "requirement": "Full Sun | Partial Shade | Indirect Light | Low Light",
    "hoursPerDay": "e.g. 6-8 hours",
    "tips": "1-2 specific light tips"
  },
  "soilGuide": {
    "type": "e.g. Well-draining loamy soil",
    "pH": "e.g. 6.0–7.0",
    "tips": "1-2 soil preparation tips"
  },
  "fertilizingGuide": {
    "frequency": "e.g. Every 30 days during growing season",
    "type": "e.g. Balanced NPK 10-10-10",
    "tips": "1-2 fertilizing tips"
  },
  "commonPests": ["pest1", "pest2", "pest3"],
  "pestControl": "2-3 sentence practical pest management advice for this specific plant",
  "diseaseManagement": "${isHealthy ? 'Preventive care tips to keep this plant healthy' : `Treatment advice for the detected condition: ${diseases}`}",
  "propagationMethods": ["method1", "method2"],
  "growthTimeline": {
    "germination": "e.g. 7-14 days",
    "seedling": "e.g. 2-4 weeks",
    "maturity": "e.g. 60-90 days"
  },
  "harvestTips": "Harvest guidance if applicable, or null if not a food plant",
  "companionPlants": ["plant1", "plant2", "plant3"],
  "toxicity": {
    "istoxic": true | false,
    "toxicTo": ["humans", "cats", "dogs"] or [],
    "details": "brief toxicity note or null"
  },
  "climateSuitability": "Ideal climate zones and temperature range for this plant",
  "quickTips": ["tip1", "tip2", "tip3", "tip4"]
}
`.trim();
}