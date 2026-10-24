// One-off: bundle official PSGC (Philippine Standard Geographic Code)
// data into a compact JSON the app can ship. Run: node scripts/build-ph-locations.js
const fs = require('fs');
const path = require('path');

const dir = path.join(process.env.TEMP, 'opencode', 'psgc');
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const regions = load('regions.json');
const provinces = load('provinces.json');
const cities = load('cities.json');
const municipalities = load('municipalities.json');

const regionLabel = (r) =>
  r.regionName && r.regionName !== r.name ? `${r.name} (${r.regionName})` : r.name;

const bundle = {
  regions: regions
    .map((r) => ({ code: r.code, label: regionLabel(r) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  provinces: provinces
    .map((p) => ({ code: p.code, name: p.name, regionCode: p.regionCode }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  places: [...cities, ...municipalities]
    .map((x) => ({ name: x.name, provinceCode: x.provinceCode || '', regionCode: x.regionCode }))
    .sort((a, b) => a.name.localeCompare(b.name)),
};

const outDir = path.join(__dirname, '..', 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'philippines-locations.json'),
  JSON.stringify(bundle),
);
console.log(
  'bundle written:',
  bundle.regions.length, 'regions |',
  bundle.provinces.length, 'provinces |',
  bundle.places.length, 'cities/municipalities',
);
