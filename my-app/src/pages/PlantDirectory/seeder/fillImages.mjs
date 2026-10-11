// ============================================================
// fillImages.mjs  —  PlantAid seed image filler
//
// Reads:   ./data.js              (export const plantsData = [...])
// Writes:  ./plantsData.withImages.js  (or ./data.js with --in-place)
//
// Node 18+ / built-in fetch only, no dependencies.
//
// For every plant it resolves a Wikipedia image from the
// scientificName (with sensible fallbacks), VERIFIES the URL
// with a real HEAD request, and only then assigns it. Anything
// that cannot be verified becomes ''.
//
// Existing non-empty imageUrls are PRESERVED — only empty ones
// are resolved, so a re-run never churns already-good images.
//
// Usage:
//   node fillImages.mjs                     # fill empty imageUrls + write output
//   node fillImages.mjs --in-place          # write straight back to data.js
//   node fillImages.mjs --limit=6           # smoke test (first 6 plants)
//   node fillImages.mjs --verify=file.js    # re-verify every URL in a file
// ============================================================

import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, isAbsolute, resolve as resolvePath } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'data.js');
const DEFAULT_OUT = join(HERE, 'plantsData.withImages.js');

// Wikimedia blocks descriptive/custom UAs on the image CDN (403).
// A browser-like UA is required and still satisfies "send a UA".
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const MAX_CONCURRENCY = 8;
const DELAY_MS = 40;
const MAX_RETRIES = 4;
const TARGET_WIDTH = 330;

// ── tiny helpers ─────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function stripTracking(raw) {
  try {
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) {
      if (k.toLowerCase().startsWith('utm_')) u.searchParams.delete(k);
    }
    const q = u.searchParams.toString();
    u.search = q ? `?${q}` : '';
    return u.href;
  } catch {
    return raw;
  }
}

// ── image candidate helpers ──────────────────────────────────
function cleanName(raw) {
  if (!raw) return '';
  let s = String(raw);
  s = s.replace(/\*/g, ' ');                       // stray asterisks
  s = s.replace(/×/g, ' ');                         // hybrid marker
  s = s.replace(/[\u2018\u2019\u201C\u201D'"][^\u2018\u2019\u201C\u201D'"]*[\u2018\u2019\u201C\u201D'"]/g, ' '); // quoted cultivars
  s = s.replace(/\b(?:var|subsp|ssp|f|cv)\.\s+\S+/gi, ' '); // var./subsp. epithets
  s = s.replace(/\([^)]*\)/g, ' ');                 // parentheticals
  return s.replace(/\s+/g, ' ').trim();
}

// ── rate-limited fetch ───────────────────────────────────────
// Three independent "lanes": at most 3 concurrent requests, and
// each lane waits >=150ms between its own requests (keeps the
// server polite while allowing ~3x the throughput of a single
// global delay).
const laneBusy = new Array(MAX_CONCURRENCY).fill(false);
const laneLast = new Array(MAX_CONCURRENCY).fill(0);
const laneWaiters = [];

async function acquire() {
  for (;;) {
    const lane = laneBusy.indexOf(false);
    if (lane !== -1) {
      laneBusy[lane] = true;
      const since = Date.now() - laneLast[lane];
      if (since < DELAY_MS) await sleep(DELAY_MS - since);
      laneLast[lane] = Date.now();
      return lane;
    }
    await new Promise((r) => laneWaiters.push(r));
  }
}

function release(lane) {
  laneBusy[lane] = false;
  const next = laneWaiters.shift();
  if (next) next();
}

function backoffDelay(attempt, res) {
  const ra = res?.headers?.get?.('retry-after');
  if (ra && !Number.isNaN(Number(ra))) return Math.min(Number(ra) * 1000, 15000);
  return Math.min(500 * 2 ** attempt, 8000) + Math.floor(Math.random() * 250);
}

async function fetchQuiet(url, { method = 'GET', parse = null } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const lane = await acquire();
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          'User-Agent': UA,
          Accept: parse === 'json' ? 'application/json' : 'image/*,*/*',
        },
        redirect: 'follow',
      });
    } catch (err) {
      release(lane);
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      return { ok: false, status: 0, contentType: '', data: null, error: err };
    }

    if (res.status === 429 || res.status >= 500) {
      release(lane);
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt, res));
        continue;
      }
      return { ok: false, status: res.status, contentType: '', data: null };
    }

    const contentType = res.headers.get('content-type') || '';
    const ok = res.status === 200 || res.status === 206;
    let data = null;
    if (parse === 'json' && res.status === 200) {
      data = await res.json().catch(() => null);
    } else {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
    }
    release(lane);
    return { ok, status: res.status, contentType, data };
  }
}

async function verifyImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  let r = await fetchQuiet(url, { method: 'HEAD' });
  if (!r.ok && (r.status === 403 || r.status === 405 || r.status === 501)) {
    r = await fetchQuiet(url, { method: 'GET' }); // some hosts reject HEAD
  }
  return r.ok && (r.contentType || '').toLowerCase().startsWith('image/');
}

// ── Wikipedia REST / action API ──────────────────────────────
async function getSummary(title) {
  const url =
    'https://en.wikipedia.org/api/rest_v1/page/summary/' +
    encodeURIComponent(title) +
    '?redirect=true';
  const r = await fetchQuiet(url, { parse: 'json' });
  if (!r.ok || !r.data) return null;
  if (r.data.type === 'disambiguation') return null;
  return r.data;
}

function imageCandidates(data) {
  const out = [];
  const thumb = data.thumbnail?.source ? stripTracking(data.thumbnail.source) : null;
  const orig = data.originalimage?.source ? stripTracking(data.originalimage.source) : null;

  // API-provided thumbnail sizes are guaranteed-valid; verify them
  // first, then fall back to the full-size original.
  if (thumb) out.push(thumb);
  if (orig) out.push(orig);
  return [...new Set(out)];
}

async function resolveFromSummaryCandidates(data) {
  for (const cand of imageCandidates(data)) {
    if (await verifyImage(cand)) return cand;
  }
  return null;
}

async function wikiSearch(query, limit = 3) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*' +
    `&srlimit=${limit}&srsearch=${encodeURIComponent(query)}`;
  const r = await fetchQuiet(url, { parse: 'json' });
  return (r.data?.query?.search ?? []).map((h) => h.title);
}

async function commonsSearch(query, limit = 3) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search&format=json&origin=*' +
    `&srnamespace=6&srlimit=${limit}&srsearch=${encodeURIComponent(query)}`;
  const r = await fetchQuiet(url, { parse: 'json' });
  return (r.data?.query?.search ?? []).map((h) => h.title);
}

async function commonsImageUrl(fileTitle) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=' +
    TARGET_WIDTH +
    `&titles=${encodeURIComponent(fileTitle)}`;
  const r = await fetchQuiet(url, { parse: 'json' });
  const pages = r.data?.query?.pages ?? {};
  for (const p of Object.values(pages)) {
    const info = p?.imageinfo?.[0];
    const u = info?.thumburl || info?.url;
    if (u) return stripTracking(u);
  }
  return null;
}

function titlesFor(plant) {
  const sci = cleanName(plant.scientificName);
  const common = cleanName(plant.name);
  const genusSpecies = sci.split(/\s+/).slice(0, 2).join(' ');
  return [...new Set([sci, genusSpecies, common, common && `${common} (plant)`].filter(Boolean))];
}

// Primary pass: summaries in lookup order.
async function resolvePrimary(plant) {
  for (const title of titlesFor(plant)) {
    const data = await getSummary(title);
    if (!data) continue;
    const url = await resolveFromSummaryCandidates(data);
    if (url) return { url, via: `summary:${title}` };
  }
  return null;
}

// Second pass: Wikipedia search then Wikimedia Commons search.
async function resolveFallback(plant) {
  const queries = [
    cleanName(plant.scientificName),
    cleanName(plant.name),
    `${cleanName(plant.name)} plant`,
  ].filter(Boolean);

  for (const q of queries) {
    for (const title of await wikiSearch(q)) {
      const data = await getSummary(title);
      if (!data) continue;
      const url = await resolveFromSummaryCandidates(data);
      if (url) return { url, via: `search:${title}` };
    }
  }

  for (const q of queries) {
    for (const file of await commonsSearch(q)) {
      const u = await commonsImageUrl(file);
      if (u && (await verifyImage(u))) return { url: u, via: `commons:${file}` };
    }
  }
  return null;
}

async function resolveImage(plant) {
  return (await resolvePrimary(plant)) ?? (await resolveFallback(plant)) ?? { url: '', via: 'none' };
}

// ── concurrency pool (worker itself is HTTP-throttled) ───────
async function pool(items, worker, size) {
  const results = new Array(items.length);
  let idx = 0;
  let done = 0;
  async function run() {
    for (;;) {
      const i = idx;
      idx += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
      done += 1;
      if (done % 25 === 0 || done === items.length) {
        process.stdout.write(`  … ${done}/${items.length} processed\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
  return results;
}

// ── source parsing / output writing ─────────────────────────
function buildOutput(sourceText, urls, { header = true } = {}) {
  const IMG_RE = /imageUrl:\s*'[^']*'/g;
  const found = sourceText.match(IMG_RE) ?? [];
  if (found.length !== urls.length) {
    throw new Error(`imageUrl count mismatch: source=${found.length} resolved=${urls.length}`);
  }
  let i = 0;
  const text = sourceText.replace(IMG_RE, () => {
    const url = urls[i];
    i += 1;
    if (url.includes("'")) throw new Error(`Single-quote in URL: ${url}`);
    return `imageUrl: '${url}'`;
  });
  return header
    ? '// AUTO-GENERATED by fillImages.mjs — review copy; original data.js untouched.\n' + text
    : text;
}

// ── verify mode ──────────────────────────────────────────────
async function verifyFile(path) {
  const url = pathToFileURL(path).href;
  const { plantsData } = await import(url);
  console.log(`Verifying ${plantsData.length} plants from ${path}\n`);
  const results = await pool(
    plantsData,
    async (p) => ({
      name: p.name,
      url: p.imageUrl,
      ok: p.imageUrl ? await verifyImage(p.imageUrl) : false,
      empty: !p.imageUrl,
    }),
    6,
  );
  const broken = results.filter((r) => r.url && !r.ok);
  const empty = results.filter((r) => r.empty);
  const valid = results.filter((r) => r.ok);
  console.log('\n===== VERIFY REPORT =====');
  console.log(`valid:  ${valid.length}`);
  console.log(`empty:  ${empty.length}`);
  console.log(`broken: ${broken.length}`);
  if (broken.length) {
    console.log('\nBROKEN:');
    for (const b of broken) console.log(`  - ${b.name}: ${b.url}`);
  }
  if (empty.length) {
    console.log('\nEMPTY imageUrl:');
    for (const e of empty) console.log(`  - ${e.name}`);
  }
  return { valid: valid.length, empty: empty.length, broken: broken.length };
}

// ── main ─────────────────────────────────────────────────────
async function main() {
  const verifyTarget = arg('verify');
  if (verifyTarget) {
    const p = isAbsolute(verifyTarget) ? verifyTarget : resolvePath(process.cwd(), verifyTarget);
    const res = await verifyFile(p);
    process.exit(res.broken === 0 ? 0 : 1);
  }

  const limit = Number(arg('limit', '0')) || 0;
  const inPlace = process.argv.includes('--in-place');
  const outPath = inPlace
    ? SRC
    : arg('out')
      ? (isAbsolute(arg('out')) ? arg('out') : resolvePath(process.cwd(), arg('out')))
      : DEFAULT_OUT;

  const sourceText = await readFile(SRC, 'utf8');
  const { plantsData } = await import(pathToFileURL(SRC).href);

  // Smoke test: resolve the first N plants regardless of current URL.
  if (limit > 0) {
    const work = plantsData.slice(0, limit);
    console.log(`[limit] resolving images for ${work.length}/${plantsData.length} plants…`);
    const resolved = await pool(work, (plant) => resolveImage(plant), MAX_CONCURRENCY);
    console.log('\n--limit set: skipping file write. Sample results:');
    work.forEach((p, i) => console.log(`  ${p.name}: ${resolved[i].url || '<empty>'}  [${resolved[i].via}]`));
    return;
  }

  // Full run: preserve verified URLs, resolve only the empty ones.
  const urls = new Array(plantsData.length).fill('');
  const toFill = [];
  plantsData.forEach((p, i) => {
    if (p.imageUrl && p.imageUrl.trim()) urls[i] = p.imageUrl;
    else toFill.push(i);
  });

  console.log(`Preserving ${plantsData.length - toFill.length} existing imageUrls; resolving ${toFill.length} empty…`);

  // Persist incrementally (atomic temp+rename, serialized) so an
  // abort keeps whatever has been resolved and a re-run resumes.
  let writeChain = Promise.resolve();
  function persist() {
    writeChain = writeChain
      .then(async () => {
        const output = buildOutput(sourceText, urls, { header: !inPlace });
        const tmp = `${outPath}.tmp`;
        try {
          await writeFile(tmp, output, 'utf8');
          await rename(tmp, outPath);
        } catch {
          // Windows/OneDrive can refuse rename-over-existing (EPERM/EBUSY)
          // — fall back to a direct in-place write.
          await writeFile(outPath, output, 'utf8');
          await rm(tmp, { force: true });
        }
      })
      .catch((e) => console.error('  persist failed:', e.message));
    return writeChain;
  }

  await pool(
    toFill,
    async (i) => {
      const plant = plantsData[i];
      const r = await resolveImage(plant);
      urls[i] = r.url;
      if (!r.url) console.log(`  MISS  ${plant.name} (${plant.scientificName})`);
      else await persist();
      return r;
    },
    MAX_CONCURRENCY,
  );

  await persist();

  const filled = urls.filter(Boolean).length;
  const misses = plantsData.filter((_, i) => !urls[i]).map((p) => p.name);
  console.log('\n===== FILL SUMMARY =====');
  console.log(`filled: ${filled}/${plantsData.length}`);
  console.log(`misses: ${misses.length}`);
  if (misses.length) console.log('  ' + misses.join(', '));
  console.log(`written: ${outPath}`);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
